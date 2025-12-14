import React, { useState, useEffect, useCallback, useMemo } from 'react';
import OnboardingModal from './components/OnboardingModal.tsx';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis, FavoriteOutfit, OutfitItem } from './types.ts';
import { generateOutfits, generateVacationPlan, analyzeWardrobeGaps, generateVisualOutfit, generateOutfitVariants } from './services/geminiService.ts';

// FEATURE FLAG: Fonctionnalité de génération visuelle désactivée temporairement
// TODO: Réactiver quand une solution viable sera trouvée
const ENABLE_VISUAL_GENERATION = false;
// Imports des composants
import Header from './components/Header.tsx';
import Auth from './components/Auth.tsx';
import LandingPage from './components/LandingPage.tsx'; 
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
import ModelProfileModal from './components/ModelProfileModal.tsx';
import OutfitChatModal from './components/OutfitChatModal.tsx';
import { LinkIcon, HeartIconSolid, ChevronDownIcon, SearchIcon, SortIcon } from './components/icons.tsx';
import { config } from './config.ts';


import { WardrobeProvider, useWardrobe } from './contexts/WardrobeContext.tsx';
import FavoriteOutfitsModal from './components/FavoriteOutfitsModal.tsx';
import WornOutfitsModal from './components/WornOutfitsModal.tsx';

import VisualResultModal from './components/VisualResultModal.tsx';

import 'react-spring-bottom-sheet/dist/style.css';

type MobileTab = 'home' | 'hauts' | 'bas' | 'chaussures' | 'accessoires';

// --- UTILITAIRE DE GESTION D'ERREURS AMÉLIORÉ ---
const getUserFriendlyError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('API_KEY_HTTP_REFERRER_BLOCKED') || message.includes('403')) {
    return "🚫 Accès refusé par Google : Domaine non autorisé. Vérifiez la console Google Cloud.";
  }
  if (message.includes('429') || message.includes('payment method') || message.includes('throttled')) {
    return "⏳ Limite de génération atteinte. Veuillez attendre quelques secondes ou ajouter un moyen de paiement sur Replicate.";
  }
  if (message.includes('prediction')) {
    return "⚠️ Erreur lors de la génération visuelle. Le service est peut-être surchargé.";
  }
  if (message.includes('404')) {
    return "⚠️ Modèle introuvable. Veuillez réessayer plus tard.";
  }
  if (message.includes('API_KEY_INVALID')) {
    return "🚫 Clé API invalide. Vérifiez votre configuration.";
  }
  
  return message;
};

const AppContent: React.FC = () => {
  
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedOutfits, setSuggestedOutfits] = useState<OutfitSuggestion[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null);
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
  const [showWornOutfitsModal, setShowWornOutfitsModal] = useState(false);
  const [showModelProfileModal, setShowModelProfileModal] = useState(false); // État pour la modale profil
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prevItemCount, setPrevItemCount] = useState(0);

  const [generatingVisualFor, setGeneratingVisualFor] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isWornOutfitsOpen, setIsWornOutfitsOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileSortBy, setMobileSortBy] = useState<'favorites' | 'newest' | 'oldest' | 'color'>('favorites');
  const [anchorItemForGeneration, setAnchorItemForGeneration] = useState<ClothingItem | ClothingSet | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOutfit, setChatOutfit] = useState<OutfitSuggestion | null>(null);
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (error) {
      const timeout = error.includes('Accès refusé') ? 10000 : 5000;
      const timer = setTimeout(() => setError(null), timeout);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('dressmup_onboarding_complete');
  });

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
    userModelImage,
    recordOutfitWear,
    getItemWearCount,
    getWornOutfitsLast7Days,
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

  const handleSelectOutfit = useCallback((outfit: OutfitSuggestion) => {
    const isAlreadySelected = selectedOutfit?.titre === outfit.titre && selectedOutfit?.description === outfit.description;

    if (isAlreadySelected) {
      setSelectedOutfit(null);
      setToast('Sélection annulée');
    } else {
      setSelectedOutfit(outfit);
      setToast('Tenue choisie ✨');

      // Enregistrer le port de la tenue dans l'historique
      const itemIds = outfit.vetements.map(item => item.id);
      recordOutfitWear(outfit.titre, outfit.description, itemIds);
    }

    setTimeout(() => setToast(null), 2000);
  }, [selectedOutfit, recordOutfitWear]);
  
  const safeClothingSets = React.useMemo(() => clothingSets || [], [clothingSets]);
  const itemIdsInSets = React.useMemo(() => new Set(safeClothingSets.flatMap(s => s.itemIds || [])), [safeClothingSets]);

  const wornOutfitsLast7Days = useMemo(() => getWornOutfitsLast7Days(), [getWornOutfitsLast7Days]);


  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
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

        // Mettre en cache la météo
        localStorage.setItem('cachedWeather', JSON.stringify({
          weather: weatherString,
          timestamp: Date.now()
        }));
      } catch (err) {
        setWeatherError("Météo indisponible.");
      }
    };

    // Vérifier d'abord si on a une météo en cache (< 30 minutes)
    const cachedWeather = localStorage.getItem('cachedWeather');
    if (cachedWeather) {
      try {
        const { weather, timestamp } = JSON.parse(cachedWeather);
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - timestamp < thirtyMinutes) {
          // Utiliser la météo en cache
          setWeatherInfo(weather);
          setWeatherError(null);
          return;
        }
      } catch (e) {
        // Cache invalide, continuer avec la géolocalisation
      }
    }

    // Vérifier si on a une position en cache (< 30 minutes)
    const cachedPosition = localStorage.getItem('cachedPosition');
    if (cachedPosition) {
      try {
        const { lat, lon, timestamp } = JSON.parse(cachedPosition);
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - timestamp < thirtyMinutes) {
          // Utiliser la position en cache
          fetchWeather(lat, lon);
          return;
        }
      } catch (e) {
        // Cache invalide, continuer avec la géolocalisation
      }
    }

    // Pas de cache valide, demander la géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Mettre en cache la position
          localStorage.setItem('cachedPosition', JSON.stringify({
            lat,
            lon,
            timestamp: Date.now()
          }));

          fetchWeather(lat, lon);
        },
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

    // Utiliser l'ancre depuis l'état si aucune n'est passée en paramètre
    const effectiveAnchor = anchorItem || anchorItemForGeneration;

    const fullContext = weatherInfo
      ? `Météo actuelle : ${weatherInfo}. Occasion : ${occasion}`
      : `Occasion : ${occasion}`;

    try {
      const outfits = await generateOutfits(safeClothingItems, safeClothingSets, fullContext, effectiveAnchor || undefined);
      setSuggestedOutfits(outfits);
      setAnchorItemForGeneration(null); // Réinitialiser l'ancre après génération
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsGenerating(false);
    }
  }, [safeClothingItems, safeClothingSets, weatherInfo, anchorItemForGeneration]);

  const handleGenerateVariants = useCallback(async (outfit: OutfitSuggestion, itemToReplace: OutfitItem) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements.");
      return;
    }
    setIsGenerating(true);
    setError(null);

    const fullContext = weatherInfo
      ? `Météo actuelle : ${weatherInfo}. Contexte original : ${outfit.description}`
      : `Contexte original : ${outfit.description}`;

    try {
      const variants = await generateOutfitVariants(safeClothingItems, safeClothingSets, fullContext, outfit, itemToReplace);
      setSuggestedOutfits(variants);
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsGenerating(false);
    }
  }, [safeClothingItems, safeClothingSets, weatherInfo]);

  const handleOpenChat = useCallback((outfit: OutfitSuggestion) => {
    setChatOutfit(outfit);
    setChatMessages([]);
    setShowChatModal(true);
  }, []);

  const handleChatMessage = useCallback(async (message: string, history: ChatMessage[]) => {
    if (!chatOutfit) return;

    setIsChatGenerating(true);
    try {
      const response = await generateChatResponse(
        chatOutfit,
        message,
        history,
        safeClothingItems,
        safeClothingSets
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsChatGenerating(false);
    }
  }, [chatOutfit, safeClothingItems, safeClothingSets]);

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
      setError(getUserFriendlyError(err));
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
      setError(getUserFriendlyError(err));
    } finally {
      setIsAnalyzingWardrobe(false);
    }
  }, [safeClothingItems, safeClothingSets]);


  const handleGenerateVisual = useCallback(async (outfit: OutfitSuggestion) => {
    // FONCTIONNALITÉ DÉSACTIVÉE: Génération visuelle
    if (!ENABLE_VISUAL_GENERATION) {
      return;
    }

    setGeneratingVisualFor(outfit.titre);
    setError(null);

    // VÉRIFICATION CLÉ : Si pas de photo de profil, on demande à l'utilisateur d'en ajouter une
    if (!userModelImage) {
      setGeneratingVisualFor(null);
      setShowModelProfileModal(true);
      setToast("Ajoutez une photo de vous pour l'essayage 📸");
      return;
    }

    try {
      const itemsInOutfit: ClothingItem[] = outfit.vetements.map(outfitItem => {
        return safeClothingItems.find(ci => ci.id === outfitItem.id || ci.analysis === outfitItem.description);
      }).filter((item): item is ClothingItem => !!item); 

      if (itemsInOutfit.length === 0) {
        throw new Error("Impossible de retrouver les articles originaux pour le rendu.");
      }

      // On envoie l'image de profil de l'utilisateur à l'IA
      const imageUrl = await generateVisualOutfit(itemsInOutfit, userModelImage);

      setGeneratedImageUrl(imageUrl);

    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setGeneratingVisualFor(null);
    }
  }, [safeClothingItems, userModelImage]); 

 
  const handleScrollToOutfits = useCallback(() => setShowOutfitModal(true), []);
  const handleScrollToVacation = useCallback(() => setShowVacationModal(true), []);
  const handleItemClick = (item: ClothingItem) => setSelectedItem(item);
  const handleCloseModal = () => setSelectedItem(null);


  const handleDeleteItem = (itemId: string) => {
    deleteClothingItem(itemId).catch(err => setError(getUserFriendlyError(err))); 
    setSelectedItem(null); 
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    updateClothingItem(updatedItem).catch(err => setError(getUserFriendlyError(err))); 
    setSelectedItem(updatedItem); 
  };
  
  const handleGenerateFromModal = (item: ClothingItem) => {
    // Stocker l'item comme ancre et ouvrir le modal de génération
    setAnchorItemForGeneration(item);
    setSelectedItem(null); // Fermer le modal de détails
    setShowOutfitModal(true); // Ouvrir le modal de génération
  };
  

  const handleCreateSet = useCallback((name: string, itemIds: string[]) => {
    createClothingSet(name, itemIds).catch(err => setError(getUserFriendlyError(err))); 
  }, [createClothingSet]);
  
  const handleRemoveSet = useCallback((setId: string) => {
    deleteClothingSet(setId).catch(err => setError(getUserFriendlyError(err))); 
  }, [deleteClothingSet]);

  const handlePullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const categoryCounts = {
    hauts: safeClothingItems.filter(item => item.category === 'Hauts').length,
    bas: safeClothingItems.filter(item => item.category === 'Bas').length,
    chaussures: safeClothingItems.filter(item => item.category === 'Chaussures').length,
    accessoires: safeClothingItems.filter(item => item.category === 'Accessoires').length,
  };

  const filteredItems = useMemo(() => {
  if (activeTab === 'home') return [];
  
  // Filtrer par catégorie
  let items = safeClothingItems.filter(item => {
    if (activeTab === 'hauts') return item.category === 'Hauts';
    if (activeTab === 'bas') return item.category === 'Bas';
    if (activeTab === 'chaussures') return item.category === 'Chaussures';
    if (activeTab === 'accessoires') return item.category === 'Accessoires';
    return false;
  });
  
  // Filtrer par recherche
  if (mobileSearchQuery.trim()) {
    const query = mobileSearchQuery.toLowerCase();
    items = items.filter(item =>
      item.analysis.toLowerCase().includes(query) ||
      item.color.toLowerCase().includes(query) ||
      item.material.toLowerCase().includes(query)
    );
  }
  
  // Trier
  return [...items].sort((a, b) => {
    switch (mobileSortBy) {
      case 'favorites':
        return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      case 'newest':
        return (b.createdAt || 0) - (a.createdAt || 0);
      case 'oldest':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'color':
        return a.color.localeCompare(b.color);
      default:
        return 0;
    }
  });
}, [activeTab, safeClothingItems, mobileSearchQuery, mobileSortBy]);

  const isModalOpen = 
    showOutfitModal || 
    showVacationModal || 
    showSetModal || 
    !!selectedItem ||  
    !!wardrobeAnalysis ||
    !!generatedImageUrl ||
    showModelProfileModal; // Ajout de la modale profil

  useEffect(() => {
  const header = document.querySelector('header');
  if (header) {
    header.style.zIndex = isModalOpen ? '10' : '50';
  }
}, [isModalOpen]);
  // Toast de succès après ajout de vêtements
useEffect(() => {
  if (!isAnalyzing && safeClothingItems.length > prevItemCount && prevItemCount > 0) {
    const addedCount = safeClothingItems.length - prevItemCount;
    setToast(`${addedCount} vêtement${addedCount > 1 ? 's' : ''} ajouté${addedCount > 1 ? 's' : ''} ✨`);
    setTimeout(() => setToast(null), 2000);
  }
  setPrevItemCount(safeClothingItems.length);
}, [isAnalyzing, safeClothingItems.length]);
  
  return (
    <main className="container mx-auto px-4 lg:px-8 py-10">
      {/* FONCTIONNALITÉ DÉSACTIVÉE: Bouton profil mannequin (mobile) */}
      {ENABLE_VISUAL_GENERATION && (
        <button
          onClick={() => setShowModelProfileModal(true)}
          className="fixed top-24 right-4 z-40 bg-white dark:bg-onyx p-2 rounded-full shadow-lg border border-gold/30 md:hidden"
          title="Mon mannequin"
        >
          {userModelImage ? (
            <img src={userModelImage} alt="Profil" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-xs">👤</div>
          )}
        </button>
      )}

      {error && (
  <div className="bg-red-500/20 border border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-8 flex items-center justify-between shadow-sm animate-pulse" role="alert">
    <div className="flex-1 mr-2">
      <strong className="font-bold block mb-1">Attention :</strong>
      <span className="block text-sm leading-relaxed">{error}</span>
    </div>
    <button 
      onClick={() => setError(null)}
      className="p-1.5 hover:bg-red-500/30 rounded-full transition-colors flex-shrink-0"
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
          
          {/* FONCTIONNALITÉ DÉSACTIVÉE: Bouton profil mannequin (desktop) */}
          {ENABLE_VISUAL_GENERATION && (
            <div className="hidden md:flex justify-end mb-4">
               <button
                  onClick={() => setShowModelProfileModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-onyx border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gold transition-colors"
               >
                  {userModelImage ? (
                    <img src={userModelImage} alt="Profil" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  )}
                  <span className="text-sm font-medium">Mon Mannequin Virtuel</span>
               </button>
            </div>
          )}
         
          {safeClothingItems.length >= 3 && (
            <div className="hidden md:block bg-gradient-to-r from-gold/10 to-gold-dark/10 border-2 border-gold/30 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">💡 Besoin d'inspiration ?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Découvrez quelles pièces acheter pour rendre votre garde-robe plus polyvalente
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  ⏱️ Analyse : ~30 secondes
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
                onShowWornOutfits={() => setShowWornOutfitsModal(true)}
                isAnalyzingWardrobe={isAnalyzingWardrobe}
                clothingCount={safeClothingItems.length}
                favoriteOutfitCount={favoriteOutfits.length}
                wornOutfitCount={wornOutfitsLast7Days.length}
              />
            )}
           {activeTab !== 'home' && (
  <div className="pb-24">
    {/* Pull to refresh indicator */}
{isRefreshing && (
  <div className="flex justify-center py-4">
    <svg className="animate-spin h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
)}
    {/* Header avec titre */}
    <div className="text-center py-4 px-4">
      <h2 className="text-2xl font-bold mb-1 capitalize">{activeTab}</h2>
      <p className="text-sm text-gray-500">
        {filteredItems.length} vêtement{filteredItems.length > 1 ? 's' : ''}
      </p>
    </div>

    {/* Barre de recherche et tri */}
    <div className="px-4 pb-4 space-y-3">
      {/* Recherche */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={mobileSearchQuery}
          onChange={(e) => setMobileSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
        />
        {mobileSearchQuery && (
          <button
            onClick={() => setMobileSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Effacer"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tri */}
      <div className="relative">
        <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <select
          value={mobileSortBy}
          onChange={(e) => setMobileSortBy(e.target.value as typeof mobileSortBy)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none cursor-pointer transition-all"
        >
          <option value="favorites">Favoris d'abord</option>
          <option value="newest">Plus récents</option>
          <option value="oldest">Plus anciens</option>
          <option value="color">Couleur (A-Z)</option>
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>

    {/* Résultats */}
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
                <HeartIconSolid className="w-4 h-4" />
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
                loading="lazy"
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
        {mobileSearchQuery ? (
          <>
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">Aucun résultat pour "{mobileSearchQuery}"</p>
            <button 
              onClick={() => setMobileSearchQuery('')}
              className="mt-3 text-gold font-medium"
            >
              Effacer la recherche
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">👕</div>
            <p className="text-gray-500 font-medium">Aucun vêtement dans cette catégorie</p>
            <p className="text-sm text-gray-400 mt-2">Appuyez sur + pour en ajouter</p>
          </>
        )}
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
                anchorItem={anchorItemForGeneration}
                onClearAnchor={() => setAnchorItemForGeneration(null)}
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
                    selectedOutfit={selectedOutfit}
                    onSelectOutfit={handleSelectOutfit}
                    onGenerateVariants={handleGenerateVariants}
                    isGenerating={isGenerating}
                    onOpenChat={handleOpenChat}
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
          selectedOutfit={selectedOutfit}
          onSelectOutfit={handleSelectOutfit}
          onGenerateVariants={handleGenerateVariants}
          isGenerating={isGenerating}
          onOpenChat={handleOpenChat}
        />
      </div>
    )}
  </div>
)}

          {wornOutfitsLast7Days.length > 0 && (
  <div className="mt-10 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-raisin-black shadow-sm">
    <button
      onClick={() => setIsWornOutfitsOpen(!isWornOutfitsOpen)}
      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-serif font-bold text-raisin-black dark:text-snow">
          Tenues Portées <span className="text-sm font-sans font-normal text-gray-500">(7 derniers jours - {wornOutfitsLast7Days.length})</span>
        </h2>
      </div>
      <div className={`transition-transform duration-300 ${isWornOutfitsOpen ? 'rotate-180' : ''} text-gray-400`}>
        <ChevronDownIcon />
      </div>
    </button>

    {isWornOutfitsOpen && (
      <div className="p-4 border-t border-black/10 dark:border-white/10 bg-snow dark:bg-onyx/50 max-h-[600px] overflow-y-auto custom-scrollbar">
        <OutfitDisplay
          outfits={wornOutfitsLast7Days.map(history => ({
            titre: history.outfitTitle,
            description: history.outfitDescription,
            vetements: history.itemIds.map(id => {
              const item = safeClothingItems.find(ci => ci.id === id);
              return {
                id: id,
                description: item ? item.analysis : 'Article supprimé'
              };
            })
          }))}
          allClothingItems={safeClothingItems}
          allClothingSets={safeClothingSets}
          favoriteOutfits={favoriteOutfits}
          onToggleFavorite={handleToggleFavorite}
          onGenerateVisual={handleGenerateVisual}
          generatingVisualFor={generatingVisualFor}
          selectedOutfit={selectedOutfit}
          onSelectOutfit={handleSelectOutfit}
          onGenerateVariants={handleGenerateVariants}
          isGenerating={isGenerating}
          onOpenChat={handleOpenChat}
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
          getItemWearCount={getItemWearCount}
        />
      )}

      {wardrobeAnalysis && (
        <WardrobeSuggestions
          analysis={wardrobeAnalysis}
          onClose={() => setWardrobeAnalysis(null)}
        />
      )}

      {/* FONCTIONNALITÉ DÉSACTIVÉE: Modal de résultat visuel */}
      {ENABLE_VISUAL_GENERATION && generatedImageUrl && (
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
        onClose={() => {
          setShowOutfitModal(false);
          setAnchorItemForGeneration(null); // Effacer l'ancre si l'utilisateur ferme sans générer
        }}
        weatherInfo={weatherInfo}
        weatherError={weatherError}
        favoriteOutfits={favoriteOutfits}
        onToggleFavorite={handleToggleFavorite}
        onGenerateVisual={handleGenerateVisual}
        generatingVisualFor={generatingVisualFor}
        selectedOutfit={selectedOutfit}
        onSelectOutfit={handleSelectOutfit}
        anchorItem={anchorItemForGeneration}
        onClearAnchor={() => setAnchorItemForGeneration(null)}
        onGenerateVariants={handleGenerateVariants}
        onOpenChat={handleOpenChat}
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

      <OutfitChatModal
        open={showChatModal}
        outfit={chatOutfit}
        onClose={() => setShowChatModal(false)}
        onSendMessage={async (message, history) => {
          await handleChatMessage(message, history);
        }}
        isGenerating={isChatGenerating}
        messages={chatMessages}
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
        selectedOutfit={selectedOutfit}
        onSelectOutfit={handleSelectOutfit}
        onGenerateVariants={handleGenerateVariants}
        isGenerating={isGenerating}
        onOpenChat={handleOpenChat}
      />

      <WornOutfitsModal
        open={showWornOutfitsModal}
        onClose={() => setShowWornOutfitsModal(false)}
        allClothingItems={safeClothingItems}
        allClothingSets={safeClothingSets}
        wornOutfits={wornOutfitsLast7Days}
        favoriteOutfits={favoriteOutfits}
        onToggleFavorite={handleToggleFavorite}
        onGenerateVisual={handleGenerateVisual}
        generatingVisualFor={generatingVisualFor}
        selectedOutfit={selectedOutfit}
        onSelectOutfit={handleSelectOutfit}
        onGenerateVariants={handleGenerateVariants}
        isGenerating={isGenerating}
        onOpenChat={handleOpenChat}
      />

      {/* NOUVELLE MODALE PROFIL (s'affiche si activée par l'utilisateur ou automatiquement si pas de photo) */}
      {/* FONCTIONNALITÉ DÉSACTIVÉE: Modal profil mannequin */}
      {ENABLE_VISUAL_GENERATION && showModelProfileModal && (
        <ModelProfileModal onClose={() => setShowModelProfileModal(false)} />
      )}

      {showOnboarding && (
  <OnboardingModal onComplete={() => setShowOnboarding(false)} />
)}
      
{/* Toast notification amélioré */}
{toast && (
  <div className="fixed bottom-32 md:bottom-8 left-1/2 -translate-x-1/2 z-[100]">
    <div className="bg-raisin-black dark:bg-white text-white dark:text-raisin-black px-6 py-3 rounded-full shadow-2xl font-medium flex items-center gap-2 animate-slide-up">
      {toast.includes('❤️') && <span className="animate-pulse">❤️</span>}
      {toast.includes('Retiré') && <span>💔</span>}
      {toast.includes('ajouté') && !toast.includes('❤️') && <span>✅</span>}
      <span>{toast.replace('❤️', '').trim()}</span>
    </div>
  </div>
)}
    </main>
  );
}


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showAuth, setShowAuth] = useState(false); // Nouvel état pour gérer la navigation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Si l'utilisateur se connecte, on n'a plus besoin d'afficher l'auth explicite
      if (currentUser) {
        setShowAuth(false);
      }
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
        // Si pas d'utilisateur, on gère la logique Landing vs Auth
        showAuth ? (
          <div className="flex items-center justify-center min-h-screen p-4 animate-slide-up">
            <div className="w-full max-w-md">
              <button 
                onClick={() => setShowAuth(false)}
                className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gold transition-colors text-sm font-medium"
              >
                ← Retour
              </button>
              <Auth user={user} />
            </div>
          </div>
        ) : (
          <LandingPage onGetStarted={() => setShowAuth(true)} />
        )
      ) : (
        // Si utilisateur connecté, on affiche l'app normalement
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
