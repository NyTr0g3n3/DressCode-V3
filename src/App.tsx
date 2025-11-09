import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis } from './types.ts';
import { analyzeClothingImages, generateOutfits, generateVacationPlan, analyzeWardrobeGaps } from './services/geminiService.ts';
import { loadClothingItems, saveClothingItems, loadClothingSets, saveClothingSets } from './services/firestoreService.ts';
import { uploadClothingImage } from './services/storageService.ts';
import Header from './components/Header.tsx';
import Auth from './components/Auth.tsx';
import ClothingUpload from './components/ClothingUpload.tsx';
import ClothingGallery from './components/ClothingGallery.tsx';
import OutfitGenerator from './components/OutfitGenerator.tsx';
import OutfitDisplay from './components/OutfitDisplay.tsx';
import ClothingDetailModal from './components/ClothingDetailModal.tsx';
import VacationPlanner from './components/VacationPlanner.tsx';
import VacationResultDisplay from './components/VacationResultDisplay.tsx';
import MobileFAB from './components/MobileFAB.tsx';
import MobileHome from './components/MobileHome.tsx';
import MobileBottomNav from './components/MobileBottomNav.tsx';
import WardrobeSuggestions from './components/WardrobeSuggestions.tsx';

type MobileTab = 'home' | 'hauts' | 'bas' | 'chaussures' | 'accessoires';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingSets, setClothingSets] = useState<ClothingSet[]>([]);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedOutfits, setSuggestedOutfits] = useState<OutfitSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vacationPlan, setVacationPlan] = useState<VacationPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [wardrobeAnalysis, setWardrobeAnalysis] = useState<WardrobeAnalysis | null>(null);
  const [isAnalyzingWardrobe, setIsAnalyzingWardrobe] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('home');

  // 🛡️ Protection: garantir que les données sont toujours des tableaux
  const safeClothingItems = React.useMemo(() => clothingItems || [], [clothingItems]);
  const safeClothingSets = React.useMemo(() => clothingSets || [], [clothingSets]);

  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const items = await loadClothingItems(user.uid);
          setClothingItems(items);
          const sets = await loadClothingSets(user.uid);
          setClothingSets(sets);
        } catch (err) {
          console.error('Erreur lors du chargement des données:', err);
        }
      } else {
        setClothingItems([]);
        setClothingSets([]);
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    console.log('🔄 Save Effect:', { user: !!user, itemsLength: clothingItems.length });
    if (user && clothingItems.length > 0) {
      console.log('💾 SAVING ITEMS...');
      saveClothingItems(user.uid, clothingItems)
        .then(() => console.log('✅ SAVE SUCCESS!'))
        .catch(error => console.error('❌ SAVE ERROR:', error));
    }
  }, [clothingItems, user]);

  useEffect(() => {
    if (user && clothingSets.length > 0) {
      saveClothingSets(user.uid, clothingSets).catch(console.error);
    }
  }, [clothingSets, user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
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
        
        let imageUrl = imageDataUrls[i];
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
          imageSrc: imageUrl,
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

  const handleGenerateOutfits = useCallback(async (context: string, anchorItem?: ClothingItem | ClothingSet) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements à votre garde-robe.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const outfits = await generateOutfits(safeClothingItems, safeClothingSets, context, anchorItem);
      setSuggestedOutfits(outfits);
    } catch (err) {
      console.error("Erreur lors de la génération des tenues:", err);
      setError("Impossible de générer des tenues. L'IA est peut-être surchargée. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  }, [safeClothingItems, safeClothingSets]);

  const handleGenerateVacationPlan = useCallback(async (days: number, context: string) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements à votre garde-robe.");
      return;
    }
    setIsGeneratingPlan(true);
    setError(null);
    try {
      const plan = await generateVacationPlan(safeClothingItems, safeClothingSets, days, context);
      setVacationPlan(plan);
    } catch (err) {
      console.error("Erreur lors de la génération du plan de valise:", err);
      setError("Impossible de générer un plan de valise. L'IA est peut-être surchargée. Veuillez réessayer.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [safeClothingItems, safeClothingSets]);

  const handleAnalyzeWardrobe = useCallback(async () => {
    if (safeClothingItems.length < 3) {
      setError("Ajoutez au moins 3 vêtements pour une analyse pertinente.");
      return;
    }

    setIsAnalyzingWardrobe(true);
    setError(null);
    
    try {
      const analysis = await analyzeWardrobeGaps(safeClothingItems, safeClothingSets);
      setWardrobeAnalysis(analysis);
    } catch (err) {
      console.error("Erreur lors de l'analyse de la garde-robe:", err);
      setError("Impossible d'analyser la garde-robe. L'IA est peut-être surchargée. Veuillez réessayer.");
    } finally {
      setIsAnalyzingWardrobe(false);
    }
  }, [safeClothingItems, safeClothingSets]);

  const handleScrollToOutfits = useCallback(() => {
  setShowOutfitModal(true);
}, []);

const handleScrollToVacation = useCallback(() => {
  setShowVacationModal(true);
}, []);

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setClothingItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    setClothingSets((prevSets) =>
      prevSets.map((set) => ({
        ...set,
        itemIds: set.itemIds.filter((id) => id !== itemId),
      }))
    );
    setSelectedItem(null);
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    setClothingItems((prevItems) =>
      prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setSelectedItem(updatedItem);
  };

  const handleGenerateFromModal = (item: ClothingItem) => {
    handleGenerateOutfits(`Créer des tenues avec ce vêtement: ${item.analysis}`, item);
    setSelectedItem(null);
  };

  const handleCreateSet = useCallback((name: string, itemIds: string[]) => {
    const newSet: ClothingSet = {
      id: `set-${Date.now()}-${Math.random()}`,
      name,
      itemIds,
    };
    setClothingSets((prev) => [...prev, newSet]);
  }, []);

  const handleRemoveSet = useCallback((setId: string) => {
    setClothingSets((prev) => prev.filter((set) => set.id !== setId));
  }, []);

  // Compteurs pour la bottom nav
  const categoryCounts = {
    hauts: safeClothingItems.filter(item => item.category === 'Hauts').length,
    bas: safeClothingItems.filter(item => item.category === 'Bas').length,
    chaussures: safeClothingItems.filter(item => item.category === 'Chaussures').length,
    accessoires: safeClothingItems.filter(item => item.category === 'Accessoires').length,
  };

  // Filtrage des items selon le tab actif
  const filteredItems = activeTab === 'home' 
    ? [] 
    : safeClothingItems.filter(item => {
        if (activeTab === 'hauts') return item.category === 'Hauts';
        if (activeTab === 'bas') return item.category === 'Bas';
        if (activeTab === 'chaussures') return item.category === 'Chaussures';
        if (activeTab === 'accessoires') return item.category === 'Accessoires';
        return false;
      });

  return (
    <div className="min-h-screen bg-snow dark:bg-onyx text-raisin-black dark:text-snow transition-colors duration-300">
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
            {/* Bouton d'analyse de garde-robe - Desktop only */}
            {safeClothingItems.length >= 3 && (
              <div className="hidden md:block bg-gradient-to-r from-gold/10 to-gold-dark/10 border-2 border-gold/30 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">💡 Besoin d'inspiration ?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Découvrez quelles pièces acheter pour rendre votre garde-robe plus polyvalente
                  </p>
                </div>
                <button
                  onClick={handleAnalyzeWardrobe}
                  disabled={isAnalyzingWardrobe}
                  className="px-4 md:px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-onyx rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base flex-shrink-0"
                >
                  {isAnalyzingWardrobe ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyse...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyser ma garde-robe
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Desktop: Upload + Gallery classique */}
            <div className="hidden md:block">
              <ClothingUpload onAnalyze={handleAnalyzeItems} isAnalyzing={isAnalyzing} />
            </div>
            
            <div className="hidden md:block">
              <ClothingGallery 
                clothingItems={safeClothingItems} 
                onItemClick={handleItemClick}
                onDeleteItem={handleDeleteItem}
              />
            </div>

            {/* Mobile: Navigation par tabs */}
            <div className="md:hidden">
              {activeTab === 'home' && (
                <MobileHome
                  onAnalyzeWardrobe={handleAnalyzeWardrobe}
                  onScrollToOutfits={handleScrollToOutfits}
                  onScrollToVacation={handleScrollToVacation}
                  isAnalyzingWardrobe={isAnalyzingWardrobe}
                  clothingCount={safeClothingItems.length}
                />
              )}
              
              {activeTab !== 'home' && (
                <div className="pb-24">
                  <div className="text-center py-6 px-4">
                    <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab}</h2>
                    <p className="text-sm text-gray-500">
                      {filteredItems.length} vêtement{filteredItems.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 px-4">
                      {filteredItems.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-transform"
                        >
                          <div className="aspect-square">
                            <img 
                              src={item.imageSrc} 
                              alt={item.analysis} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium line-clamp-2">{item.analysis}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.color}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <p className="text-gray-500">Aucun vêtement dans cette catégorie</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10">
            <div id="outfit-generator">
              <OutfitGenerator 
                clothingItems={safeClothingItems}
                clothingSets={safeClothingSets}
                onGenerate={handleGenerateOutfits}
                isGenerating={isGenerating}
              />
            </div>
            {suggestedOutfits.length > 0 && <OutfitDisplay outfits={suggestedOutfits} allClothingItems={safeClothingItems} />}
            <div id="vacation-planner">
              <VacationPlanner
                clothingItems={safeClothingItems}
                clothingSets={safeClothingSets}
                onGeneratePlan={handleGenerateVacationPlan}
                isGenerating={isGeneratingPlan}
              />
            </div>
            {vacationPlan && (
              <VacationResultDisplay 
                plan={vacationPlan} 
                allClothingItems={safeClothingItems}
                onCreateSet={handleCreateSet}
              />
            )}
          </div>
        </div>

        {selectedItem && (
            <ClothingDetailModal 
                item={selectedItem} 
                clothingSets={safeClothingSets}
                onClose={handleCloseModal} 
                onUpdate={handleUpdateItem}
                onGenerateFrom={handleGenerateFromModal}
                onRemoveSet={handleRemoveSet}
            />
        )}
        
        {wardrobeAnalysis && (
          <WardrobeSuggestions
            analysis={wardrobeAnalysis}
            onClose={() => setWardrobeAnalysis(null)}
          />
        )}
        
        {/* FAB Mobile */}
        <MobileFAB 
          onFilesSelected={handleAnalyzeItems}
          isAnalyzing={isAnalyzing}
        />
        
        {/* Bottom Navigation Mobile */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={categoryCounts}
        />

        {showOutfitModal && (
  <OutfitModal 
    onClose={() => setShowOutfitModal(false)}
    // ... props nécessaires
  />
)}

{showVacationModal && (
  <VacationModal 
    onClose={() => setShowVacationModal(false)}
    // ... props nécessaires  
  />
)}
      </main>
    </div>
  );
};

export default App;
