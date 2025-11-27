import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis, FavoriteOutfit } from './types.ts';
import { generateOutfits, generateVacationPlan, analyzeWardrobeGaps, generateVisualOutfit } from './services/geminiService.ts';
// Imports des composants
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
import OutfitModal from './components/OutfitModal.tsx';  
import VacationModal from './components/VacationModal.tsx'; 
import SetCreatorModal from './components/SetCreatorModal.tsx';
import { LinkIcon, HeartIconSolid, ChevronDownIcon } from './components/icons.tsx'; 
import { config } from './config.ts';


import { WardrobeProvider, useWardrobe } from './contexts/WardrobeContext.tsx';
import FavoriteOutfitsModal from './components/FavoriteOutfitsModal.tsx';

import VisualResultModal from './components/VisualResultModal.tsx'; 

import 'react-spring-bottom-sheet/dist/style.css';

type MobileTab = 'home' | 'hauts' | 'bas' | 'chaussures' | 'accessoires';


const AppContent: React.FC = () => {
  
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedOutfits, setSuggestedOutfits] = useState<OutfitSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vacationPlan, setVacationPlan] = useState<VacationPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [wardrobeAnalysis, setWardrobeAnalysis] = useState<WardrobeAnalysis | null>(null);
  const [isAnalyzingWardrobe, setIsAnalyzingWardrobe] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [generatingVisualFor, setGeneratingVisualFor] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    useEffect(() => {
    if (error) {
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }
  }, [error]);

  
  const { 
    clothingItems, 
    clothingSets, 
    isAnalyzing, 
    analyzeClothingItems, 
    deleteClothingItem,   
    createClothingSet,    
    updateClothingItem,  
    deleteClothingSet,
    favoriteOutfits,     
    addFavoriteOutfit,   
    deleteFavoriteOutfit,
    loading
  } = useWardrobe();

  const [toast, setToast] = useState<string | null>(null);
  const safeClothingItems = React.useMemo(() => {
  const items = clothingItems || [];
  return items.sort((a, b) => 
      (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
    );
  }, [clothingItems]);


  const handleToggleFavorite = useCallback((outfit: OutfitSuggestion) => {
  const existingFavorite = favoriteOutfits.find(
    (fav) => fav.titre === outfit.titre && fav.description === outfit.description
  );

  if (existingFavorite) {
    deleteFavoriteOutfit(existingFavorite.id);
    setToast('Retiré des favoris');
  } else {
    addFavoriteOutfit(outfit);
    setToast('Ajouté aux favoris ❤️');
  }
  
  setTimeout(() => setToast(null), 2000);
}, [favoriteOutfits, addFavoriteOutfit, deleteFavoriteOutfit]);
  const safeClothingSets = React.useMemo(() => clothingSets || [], [clothingSets]);
  const itemIdsInSets = React.useMemo(() => new Set(safeClothingSets.flatMap(s => s.itemIds || [])), [safeClothingSets]);

 
  useEffect(() => {
    const fetchWeather = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      const API_KEY = config.openWeatherApiKey;
      if (!API_KEY) {
        setWeatherError("Service météo non configuré.");
        return; 
      }
      const API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;

      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Impossible de récupérer la météo.");
        const data = await response.json();
        const weatherString = `${Math.round(data.main.temp)}°C, ${data.weather[0].description}, à ${data.name}`;
        setWeatherInfo(weatherString);
        setWeatherError(null);
      } catch (err) {
        setWeatherError("Météo indisponible.");
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        fetchWeather,
        () => setWeatherError("Activez la géolocalisation pour la météo.")
      );
    } else {
      setWeatherError("Géolocalisation non supportée.");
    }
  }, []);

 
  const handleGenerateOutfits = useCallback(async (occasion: string, anchorItem?: ClothingItem | ClothingSet) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    const fullContext = weatherInfo 
      ? `Météo actuelle : ${weatherInfo}. Occasion : ${occasion}`
      : `Occasion : ${occasion}`;

    try {
      const outfits = await generateOutfits(safeClothingItems, safeClothingSets, fullContext, anchorItem);
      setSuggestedOutfits(outfits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsGenerating(false);
    }
  }, [safeClothingItems, safeClothingSets, weatherInfo]);

  const handleGenerateVacationPlan = useCallback(async (days: number, context: string, maxWeight?: number) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements.");
      return;
    }
    setIsGeneratingPlan(true);
    setError(null);
    try {
      // Passer maxWeight à la fonction du service
      const plan = await generateVacationPlan(safeClothingItems, safeClothingSets, days, context, maxWeight);
      setVacationPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsGeneratingPlan(false);
    }
}, [safeClothingItems, safeClothingSets]);

  const handleAnalyzeWardrobe = useCallback(async () => {
    if (safeClothingItems.length < 3) {
      setError("Ajoutez au moins 3 vêtements pour une analyse.");
      return;
    }
    setIsAnalyzingWardrobe(true);
    setError(null);
    try {
      const analysis = await analyzeWardrobeGaps(safeClothingItems, safeClothingSets);
      setWardrobeAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsAnalyzingWardrobe(false);
    }
  }, [safeClothingItems, safeClothingSets]);


  const handleGenerateVisual = useCallback(async (outfit: OutfitSuggestion) => {
    setGeneratingVisualFor(outfit.titre);
    setError(null);

    try {
      const itemsInOutfit: ClothingItem[] = outfit.vetements.map(outfitItem => {
        return safeClothingItems.find(ci => ci.id === outfitItem.id || ci.analysis === outfitItem.description);
      }).filter((item): item is ClothingItem => !!item); // Filtre les items non trouvés

      if (itemsInOutfit.length === 0) {
        throw new Error("Impossible de retrouver les articles originaux pour le rendu.");
      }


      const imageUrl = await generateVisualOutfit(itemsInOutfit, outfit.description);


      setGeneratedImageUrl(imageUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue lors du rendu visuel");
    } finally {
      setGeneratingVisualFor(null);
    }
  }, [safeClothingItems]); 

 
  const handleScrollToOutfits = useCallback(() => setShowOutfitModal(true), []);
  const handleScrollToVacation = useCallback(() => setShowVacationModal(true), []);
  const handleItemClick = (item: ClothingItem) => setSelectedItem(item);
  const handleCloseModal = () => setSelectedItem(null);


  const handleDeleteItem = (itemId: string) => {
    deleteClothingItem(itemId).catch(setError); 
    setSelectedItem(null); 
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    updateClothingItem(updatedItem).catch(setError); 
    setSelectedItem(updatedItem); 
  };
  
  const handleGenerateFromModal = (item: ClothingItem) => {
    const occasion = `Focus sur l'article : ${item.analysis}`;
    handleGenerateOutfits(occasion, item);
    setSelectedItem(null);
    if (window.innerWidth < 768) setShowOutfitModal(true);
  };
  

  const handleCreateSet = useCallback((name: string, itemIds: string[]) => {
    createClothingSet(name, itemIds).catch(setError); 
  }, [createClothingSet]);
  
  const handleRemoveSet = useCallback((setId: string) => {
    deleteClothingSet(setId).catch(setError); 
  }, [deleteClothingSet]);

  

  const categoryCounts = {
    hauts: safeClothingItems.filter(item => item.category === 'Hauts').length,
    bas: safeClothingItems.filter(item => item.category === 'Bas').length,
    chaussures: safeClothingItems.filter(item => item.category === 'Chaussures').length,
    accessoires: safeClothingItems.filter(item => item.category === 'Accessoires').length,
  };

  const filteredItems = activeTab === 'home' 
    ? [] 
    : safeClothingItems.filter(item => {
        if (activeTab === 'hauts') return item.category === 'Hauts';
        if (activeTab === 'bas') return item.category === 'Bas';
        if (activeTab === 'chaussures') return item.category === 'Chaussures';
        if (activeTab === 'accessoires') return item.category === 'Accessoires';
        return false;
      });

  const isModalOpen = 
    showOutfitModal || 
    showVacationModal || 
    showSetModal || 
    !!selectedItem ||  
    !!wardrobeAnalysis ||
    !!generatedImageUrl; 
  
  return (
    <main className="container mx-auto px-4 lg:px-8 py-10">
      {error && (
  <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-8 flex items-center justify-between" role="alert">
    <div>
      <strong className="font-bold">Erreur: </strong>
      <span className="inline">{error}</span>
    </div>
    <button 
      onClick={() => setError(null)}
      className="p-1 hover:bg-red-500/30 rounded-full transition-colors"
      aria-label="Fermer"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-2 space-y-10">
          
         
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
                {isAnalyzingWardrobe ? 'Analyse...' : 'Analyser ma garde-robe'}
              </button>
            </div>
          )}
          
        
          <div className="hidden md:block">
            <ClothingUpload onAnalyze={analyzeClothingItems} isAnalyzing={isAnalyzing} />
          </div>
        
          <div className="hidden md:block">
            <ClothingGallery 
              clothingItems={safeClothingItems} 
              clothingSets={safeClothingSets}
              onItemClick={handleItemClick}
              onDeleteItem={handleDeleteItem}
              onCreateSet={handleCreateSet}
              isLoading={loading}
            />
          </div>

          
          <div className="md:hidden">
            {activeTab === 'home' && (
              <MobileHome
                onAnalyzeWardrobe={handleAnalyzeWardrobe}
                onScrollToOutfits={handleScrollToOutfits}
                onScrollToVacation={handleScrollToVacation}
                onStartSetCreation={() => setShowSetModal(true)}
                onShowFavorites={() => setShowFavoriteModal(true)}
                isAnalyzingWardrobe={isAnalyzingWardrobe}
                clothingCount={safeClothingItems.length}
                favoriteOutfitCount={favoriteOutfits.length}
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
                        className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-transform"
                      >
                        {item.isFavorite ? (
                          <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-red-500 z-10">
                            <HeartIconSolid />
                          </span>
                        ) : itemIdsInSets.has(item.id) ? (
                          <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white z-10">
                            <LinkIcon />
                          </span>
                        ) : null}

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
        
        <div className="lg:col-span-1 space-y-10 lg:sticky lg:top-40 hidden md:block">
            <div id="outfit-generator">
              <OutfitGenerator
                clothingItems={safeClothingItems}
                clothingSets={safeClothingSets}
                onGenerate={handleGenerateOutfits}
                isGenerating={isGenerating}
                weatherInfo={weatherInfo} 
                weatherError={weatherError}
              />
            </div>
            {suggestedOutfits.length > 0 && (
                  <OutfitDisplay 
                    outfits={suggestedOutfits} 
                    allClothingItems={safeClothingItems} 
                    allClothingSets={safeClothingSets}
                    favoriteOutfits={favoriteOutfits}
                    onToggleFavorite={handleToggleFavorite}
                    onGenerateVisual={handleGenerateVisual}
                    generatingVisualFor={generatingVisualFor}
                  />
              )}

          {favoriteOutfits.length > 0 && (
  <div className="mt-10 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-raisin-black shadow-sm">
    <button
      onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <HeartIconSolid className="text-gold w-5 h-5" />
        <h2 className="text-xl font-serif font-bold text-raisin-black dark:text-snow">
          Mes Favoris <span className="text-sm font-sans font-normal text-gray-500">({favoriteOutfits.length})</span>
        </h2>
      </div>
      <div className={`transition-transform duration-300 ${isFavoritesOpen ? 'rotate-180' : ''} text-gray-400`}>
        <ChevronDownIcon />
      </div>
    </button>

    {isFavoritesOpen && (
      <div className="p-4 border-t border-black/10 dark:border-white/10 bg-snow dark:bg-onyx/50 max-h-[600px] overflow-y-auto custom-scrollbar">
        <OutfitDisplay
          outfits={favoriteOutfits}
          allClothingItems={safeClothingItems}
          allClothingSets={safeClothingSets}
          favoriteOutfits={favoriteOutfits}
          onToggleFavorite={handleToggleFavorite}
          onGenerateVisual={handleGenerateVisual}
          generatingVisualFor={generatingVisualFor}
        />
      </div>
    )}
  </div>
)}
            
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
                allClothingSets={safeClothingSets}
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
          onDelete={handleDeleteItem}
        />
      )}

      {wardrobeAnalysis && (
        <WardrobeSuggestions
          analysis={wardrobeAnalysis}
          onClose={() => setWardrobeAnalysis(null)}
        />
      )}

      {generatedImageUrl && (
        <VisualResultModal
          imageUrl={generatedImageUrl}
          onClose={() => setGeneratedImageUrl(null)}
        />
      )}

      <MobileFAB
        onFilesSelected={analyzeClothingItems}
        isAnalyzing={isAnalyzing}
        isOtherModalOpen={isModalOpen}
      />
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={categoryCounts}
      />

      <OutfitModal
        open={showOutfitModal}
        clothingItems={safeClothingItems}
        clothingSets={safeClothingSets}
        onGenerate={handleGenerateOutfits}
        isGenerating={isGenerating}
        suggestedOutfits={suggestedOutfits}
        onClose={() => setShowOutfitModal(false)}
        weatherInfo={weatherInfo}
        weatherError={weatherError}
        favoriteOutfits={favoriteOutfits}
        onToggleFavorite={handleToggleFavorite}
        onGenerateVisual={handleGenerateVisual}
        generatingVisualFor={generatingVisualFor}
      />
    
      <VacationModal
        open={showVacationModal} 
        clothingItems={safeClothingItems}
        clothingSets={safeClothingSets}
        onGeneratePlan={handleGenerateVacationPlan}
        isGenerating={isGeneratingPlan}
        vacationPlan={vacationPlan}
        onCreateSet={handleCreateSet}
        onClose={() => setShowVacationModal(false)}
      />
      <SetCreatorModal 
              open={showSetModal}
              clothingItems={safeClothingItems}
              clothingSets={safeClothingSets}
              onClose={() => setShowSetModal(false)}
              onCreateSet={(name, itemIds) => {
                handleCreateSet(name, itemIds);
                setShowSetModal(false);
              }}
            />

      <FavoriteOutfitsModal
        open={showFavoriteModal}
        onClose={() => setShowFavoriteModal(false)}
        allClothingItems={safeClothingItems}
        allClothingSets={safeClothingSets}
        favoriteOutfits={favoriteOutfits}
        onToggleFavorite={handleToggleFavorite}
        onGenerateVisual={handleGenerateVisual}
        generatingVisualFor={generatingVisualFor}
      />

    
{toast && (
  <div className="fixed bottom-32 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
    <div className="bg-raisin-black dark:bg-white text-white dark:text-raisin-black px-6 py-3 rounded-full shadow-2xl font-medium">
      {toast}
    </div>
  </div>
)}
    </main>
  );
}


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  return (
    <div className="min-h-screen bg-snow dark:bg-onyx text-raisin-black dark:text-snow transition-colors duration-300">
      {!user ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Auth user={user} />
        </div>
      ) : (
        <>
          <Header theme={theme} toggleTheme={toggleTheme}>
            <Auth user={user} />
          </Header>
          <WardrobeProvider user={user}>
            <AppContent /> 
          </WardrobeProvider>
        </>
      )}
    </div>
  );
};

export default App;
