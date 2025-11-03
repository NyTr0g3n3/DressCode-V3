import React, { useState, useEffect, useCallback } from 'react';
import { uploadClothingImage } from './services/storageService';
import { saveClothingItems, loadClothingItems, saveClothingSets, loadClothingSets } from './services/firestoreService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan } from './types.ts';
import { analyzeClothingImages, generateOutfits, generateVacationPlan } from './services/geminiService.ts';
import Header from './components/Header.tsx';
import Auth from './components/Auth.tsx';
import ClothingUpload from './components/ClothingUpload.tsx';
import ClothingGallery from './components/ClothingGallery.tsx';
import OutfitGenerator from './components/OutfitGenerator.tsx';
import OutfitDisplay from './components/OutfitDisplay.tsx';
import ClothingDetailModal from './components/ClothingDetailModal.tsx';
import { LoadingSpinner } from './components/icons.tsx';
import VacationPlanner from './components/VacationPlanner.tsx';
import VacationResultDisplay from './components/VacationResultDisplay.tsx';


const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingSets, setClothingSets] = useState<ClothingSet[]>([]);
  const [suggestedOutfits, setSuggestedOutfits] = useState<OutfitSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [outfitContext, setOutfitContext] = useState('');
  const [vacationPlan, setVacationPlan] = useState<VacationPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Charger les données de l'utilisateur
useEffect(() => {
  if (user) {
    const loadUserData = async () => {
      try {
        const items = await loadClothingItems(user.uid);
        const sets = await loadClothingSets(user.uid);
        setClothingItems(items);
        setClothingSets(sets);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    loadUserData();
  }
}, [user]);

// Sauvegarder automatiquement les vêtements
useEffect(() => {
  console.log('🔄 Save Effect:', { user: !!user, itemsLength: clothingItems.length });
  if (user && clothingItems.length > 0) {
    console.log('💾 SAVING ITEMS...');
    saveClothingItems(user.uid, clothingItems)
      .then(() => console.log('✅ SAVE SUCCESS!'))
      .catch(error => console.error('❌ SAVE ERROR:', error));
  }
}, [clothingItems, user]);

// Sauvegarder automatiquement les ensembles
useEffect(() => {
  if (user && clothingSets.length > 0) {
    saveClothingSets(user.uid, clothingSets).catch(console.error);
  }
}, [clothingSets, user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

const handleAnalyzeItems = useCallback(async (files: File[]) => {
  if (files.length === 0) return;
  setIsAnalyzing(true);
  setError(null);

  try {
    const imagePromises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    const imageDataUrls = await Promise.all(imagePromises);
    const base64Images = imageDataUrls.map(url => url.split(',')[1]);
    
    const analysisResults = await analyzeClothingImages(base64Images);
    
    const itemsCount = Math.min(analysisResults.length, files.length);
    const newItems: ClothingItem[] = [];

    for (let i = 0; i < itemsCount; i++) {
      const itemId = `${Date.now()}-${files[i].name}-${Math.random()}`;
      
      // Upload l'image dans Storage et récupère l'URL
      let imageUrl = imageDataUrls[i]; // Fallback vers base64
      if (user) {
        try {
          imageUrl = await uploadClothingImage(user.uid, imageDataUrls[i], itemId);
          console.log('✅ Image uploaded to Storage:', imageUrl);
        } catch (uploadError) {
          console.error('⚠️ Failed to upload image, using base64:', uploadError);
        }
      }
      
      newItems.push({
        id: itemId,
        imageSrc: imageUrl, // Maintenant c'est une URL, pas du base64
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
}, [user]);

  const handleGenerateOutfits = useCallback(async (context: string, anchorItemOrSet?: ClothingItem | ClothingSet) => {
    const totalItems = clothingItems.length - clothingSets.flatMap(s => s.itemIds).length + clothingSets.length;
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
  
  const handleGenerateVacationPlan = useCallback(async (days: number, context: string) => {
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

  const handleRemoveItem = (id: string) => {
    setClothingItems(prev => prev.filter(item => item.id !== id));
    
    setClothingSets(prev => {
        const newSets = prev.map(set => {
            if (set.itemIds.includes(id)) {
                return { ...set, itemIds: set.itemIds.filter(itemId => itemId !== id) };
            }
            return set;
        });
        return newSets.filter(set => set.itemIds.length > 1);
    });
  };
  
  const handleRemoveSet = (id: string) => {
    setClothingSets(prev => prev.filter(set => set.id !== id));
  };

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    setClothingItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    handleCloseModal();
  };
  
  const handleGenerateFromModal = (item: ClothingItem) => {
      if (!outfitContext.trim()) {
          setError("Veuillez d'abord décrire une occasion ou une météo dans le créateur de tenues.");
          return;
      }
      handleCloseModal();
      handleGenerateOutfits(outfitContext, item);
  }

  const handleCreateSet = (itemIds: string[], name: string) => {
    if (itemIds.length < 2 || !name.trim()) return;

    const firstItem = clothingItems.find(item => item.id === itemIds[0]);
    if (!firstItem) return;

    const newSet: ClothingSet = {
      id: `${Date.now()}-set-${Math.random()}`,
      name,
      itemIds,
      imageSrc: firstItem.imageSrc,
    };
    setClothingSets(prev => [...prev, newSet]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-snow dark:bg-onyx flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-snow dark:bg-onyx text-raisin-black dark:text-snow transition-colors duration-500">
        <Header theme={theme} toggleTheme={toggleTheme} />
        <main className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Auth user={user} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-snow dark:bg-onyx text-raisin-black dark:text-snow transition-colors duration-500">
      <Header theme={theme} toggleTheme={toggleTheme}>
        <Auth user={user} />
        
      </Header>
      
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
