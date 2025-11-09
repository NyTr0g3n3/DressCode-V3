import React, { useState, useEffect, useCallback } from 'react';
import { analyzeClothingImages, generateOutfits, generateVacationPlan } from './services/geminiService.js';
import Header from './components/Header.jsx';
import ClothingUpload from './components/ClothingUpload.jsx';
import ClothingGallery from './components/ClothingGallery.jsx';
import OutfitGenerator from './components/OutfitGenerator.jsx';
import OutfitDisplay from './components/OutfitDisplay.jsx';
import ClothingDetailModal from './components/ClothingDetailModal.jsx';
import { LoadingSpinner } from './components/icons.jsx';
import VacationPlanner from './components/VacationPlanner.jsx';
import VacationResultDisplay from './components/VacationResultDisplay.jsx';


const App = () => {
  const [theme, setTheme] = useState('dark');
  const [clothingItems, setClothingItems] = useState([]);
  const [clothingSets, setClothingSets] = useState([]);
  const [suggestedOutfits, setSuggestedOutfits] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [outfitContext, setOutfitContext] = useState('');
  const [vacationPlan, setVacationPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);


  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAnalyzeItems = useCallback(async (files) => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const imagePromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const imageDataUrls = await Promise.all(imagePromises);
      const base64Images = imageDataUrls.map(url => url.split(',')[1]);
      
      const analysisResults = await analyzeClothingImages(base64Images);
      
      const itemsCount = Math.min(analysisResults.length, files.length);
      const newItems = [];

      for (let i = 0; i < itemsCount; i++) {
        newItems.push({
          id: `${Date.now()}-${files[i].name}-${Math.random()}`,
          imageSrc: imageDataUrls[i],
          ...analysisResults[i],
        });
      }

      if (analysisResults.length !== files.length) {
        console.warn(`Le nombre de résultats d'analyse (${analysisResults.length}) ne correspond pas au nombre de fichiers (${files.length}).`);
        setError(`L'IA a analysé ${newItems.length} sur ${files.length} image(s). Certaines ont peut-être été ignorées.`);
      }

      setClothingItems(prev => [...prev, ...newItems]);

    } catch (err) {
      console.error("Erreur lors de l'analyse par lot des images:", err);
      setError("Une erreur est survenue lors de l'analyse des images. L'IA a peut-être rencontré un problème. Veuillez réessayer.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleGenerateOutfits = useCallback(async (context, anchorItemOrSet) => {
    const totalItems = clothingItems.length - (clothingSets || []).flatMap(s => s.itemIds || []).length + (clothingSets || []).length;
    if (totalItems < 2) {
      setError("Veuillez avoir au moins deux articles ou ensembles pour générer des tenues.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuggestedOutfits([]);
    try {
      const outfits = await generateOutfits(clothingItems, clothingSets, context, anchorItemOrSet);
      setSuggestedOutfits(outfits);
    } catch (err) {
      console.error("Erreur lors de la génération des tenues:", err);
      setError("Impossible de générer des tenues. L'IA est peut-être surchargée. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  }, [clothingItems, clothingSets]);
  
  const handleGenerateVacationPlan = useCallback(async (days, context) => {
    if (clothingItems.length < days) {
      setError(`Veuillez avoir au moins ${days} articles dans votre garde-robe pour un voyage de ${days} jours.`);
      return;
    }
    
    setIsGeneratingPlan(true);
    setError(null);
    setVacationPlan(null);
    try {
      const plan = await generateVacationPlan(clothingItems, clothingSets, days, context);
      setVacationPlan(plan);
    } catch (err) {
      console.error("Erreur lors de la génération du plan de valise:", err);
      setError("Impossible de générer le plan de valise. L'IA est peut-être surchargée. Veuillez réessayer.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [clothingItems, clothingSets]);

  const handleRemoveItem = (id) => {
    // Supprimer l'article de la liste principale
    setClothingItems(prev => prev.filter(item => item.id !== id));
    
    // Vérifier les ensembles et les mettre à jour
    setClothingSets(prev => {
        const newSets = prev.map(set => {
            // Si l'ensemble inclut l'article supprimé, le retirer de l'ensemble
            if (set.itemIds.includes(id)) {
                return { ...set, itemIds: set.itemIds.filter(itemId => itemId !== id) };
            }
            return set;
        });
        // Filtrer les ensembles qui sont maintenant invalides (moins de 2 articles)
        return newSets.filter(set => set.itemIds.length > 1);
    });
  };
  
  const handleRemoveSet = (id) => {
    setClothingSets(prev => prev.filter(set => set.id !== id));
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleUpdateItem = (updatedItem) => {
    setClothingItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    handleCloseModal();
  };
  
  const handleGenerateFromModal = (item) => {
      if (!outfitContext.trim()) {
          setError("Veuillez d'abord décrire une occasion ou une météo dans le créateur de tenues.");
          return;
      }
      handleCloseModal();
      handleGenerateOutfits(outfitContext, item);
  }

  const handleCreateSet = (itemIds, name) => {
    if (itemIds.length < 2 || !name.trim()) return;

    const firstItem = clothingItems.find(item => item.id === itemIds[0]);
    if (!firstItem) return;

    const newSet = {
      id: `${Date.now()}-set-${Math.random()}`,
      name,
      itemIds,
      imageSrc: firstItem.imageSrc,
    };
    setClothingSets(prev => [...prev, newSet]);
  };

  return (
    <div className="min-h-screen bg-snow dark:bg-onyx text-raisin-black dark:text-snow transition-colors duration-500">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto px-4 lg:px-8 py-10">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-8" role="alert">
            <strong className="font-bold">Erreur: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <ClothingUpload onAnalyze={handleAnalyzeItems} isAnalyzing={isAnalyzing} />
            <ClothingGallery 
              clothingItems={clothingItems}
              clothingSets={clothingSets} 
              onRemoveItem={handleRemoveItem}
              onRemoveSet={handleRemoveSet} 
              onSelectItem={handleSelectItem}
              onCreateSet={handleCreateSet}
            />
          </div>
          <div className="space-y-10">
             <div className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 p-6 lg:p-8 sticky top-28">
                <VacationPlanner onGenerate={handleGenerateVacationPlan} isGenerating={isGeneratingPlan} />
                {isGeneratingPlan && (
                  <div className="flex flex-col items-center justify-center mt-8">
                    <LoadingSpinner />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">L'IA prépare votre valise...</p>
                  </div>
                )}
                {vacationPlan && <VacationResultDisplay plan={vacationPlan} allClothingItems={clothingItems} />}
                
                {(vacationPlan || isGeneratingPlan || suggestedOutfits.length > 0) && <hr className="my-8 border-dashed border-gray-200 dark:border-gray-700"/>}

                <OutfitGenerator onGenerate={handleGenerateOutfits} isGenerating={isGenerating} context={outfitContext} setContext={setOutfitContext} />
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center mt-8">
                    <LoadingSpinner />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">L'IA compose vos tenues...</p>
                  </div>
                )}
                {suggestedOutfits.length > 0 && <OutfitDisplay outfits={suggestedOutfits} allClothingItems={clothingItems} />}
            </div>
          </div>
        </div>
        {selectedItem && (
            <ClothingDetailModal 
                item={selectedItem} 
                clothingSets={clothingSets}
                onClose={handleCloseModal} 
                onUpdate={handleUpdateItem}
                onGenerateFrom={handleGenerateFromModal}
                onRemoveSet={handleRemoveSet}
            />
        )}
      </main>
    </div>
  );
};

export default App;
