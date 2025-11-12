import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis } from './types.ts';
import { generateOutfits, generateVacationPlan, analyzeWardrobeGaps } from './services/geminiService.ts';
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
import { LinkIcon } from './components/icons.tsx';
import { config } from './config.ts';


import { WardrobeProvider, useWardrobe } from './contexts/WardrobeContext.tsx';

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
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  
  const { 
    clothingItems, 
    clothingSets, 
    isAnalyzing, 
    analyzeClothingItems, 
    deleteClothingItem,   
    createClothingSet,    
    updateClothingItem,  
    deleteClothingSet    
  } = useWardrobe();

 
  const safeClothingItems = React.useMemo(() => clothingItems || [], [clothingItems]);
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

  const handleGenerateVacationPlan = useCallback(async (days: number, context: string) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements.");
      return;
    }
    setIsGeneratingPlan(true);
    setError(null);
    try {
      const plan = await generateVacationPlan(safeClothingItems, safeClothingSets, days, context);
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


  return (
    <main className="container mx-auto px-4 lg:px-8 py-10">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-8" role="alert">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
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
                {/* ... (icône de chargement) ... */}
                {isAnalyzingWardrobe ? 'Analyse...' : 'Analyser ma garde-robe'}
              </button>
            </div>
          )}
          
          <div className="hidden md:block">
            {/* ✅ On passe les fonctions du contexte */}
            <ClothingUpload onAnalyze={analyzeClothingItems} isAnalyzing={isAnalyzing} />
          </div>
          <div className="hidden md:block">
            {/* ✅ On passe les fonctions locales qui appellent le contexte */}
            <ClothingGallery 
              clothingItems={safeClothingItems} 
              clothingSets={safeClothingSets}
              onItemClick={handleItemClick}
              onDeleteItem={handleDeleteItem}
              onCreateSet={handleCreateSet}
            />
          </div>

          <div className="md:hidden">
            {activeTab === 'home' && (
              <MobileHome
                onAnalyzeWardrobe={handleAnalyzeWardrobe}
                onScrollToOutfits={handleScrollToOutfits}
                onScrollToVacation={handleScrollToVacation}
                onStartSetCreation={() => setShowSetModal(true)}
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
                        className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-transform"
                      >
                        {itemIdsInSets.has(item.id) && (
                          <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white z-10">
                            <LinkIcon />
                          </span>
                        )}
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

        <div className="space-y-10 hidden md:block">
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
          {suggestedOutfits.length > 0 && <OutfitDisplay outfits={suggestedOutfits} allClothingItems={safeClothingItems} allClothingSets={safeClothingSets} />}
          
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

      <MobileFAB
        onFilesSelected={analyzeClothingItems}
        isAnalyzing={isAnalyzing}
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
