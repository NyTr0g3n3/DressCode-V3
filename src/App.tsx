import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingModal from './components/OnboardingModal.tsx';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import type { ClothingItem, OutfitSuggestion, ClothingSet, VacationPlan, WardrobeAnalysis, OutfitItem, ChatMessage } from './types.ts';
import { generateOutfits, generateVacationPlan, analyzeWardrobeGaps, generateVisualOutfit, generateOutfitVariants, generateChatResponse } from './services/geminiService.ts';

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
import ClothingSetsModal from './components/ClothingSetsModal.tsx';
import ModelProfileModal from './components/ModelProfileModal.tsx';
import OutfitChatModal from './components/OutfitChatModal.tsx';
import { HeartIconSolid, ChevronDownIcon } from './components/icons.tsx';
import { useWeather } from './hooks/useWeather.ts';
import { useToast } from './hooks/useToast.ts';
import { useMobileWardrobeFilters } from './hooks/useMobileWardrobeFilters.ts';
import { buildWeatherContext, buildReferenceWeatherInfo, getDefaultWeatherDay, getWeatherDayLabel, type WeatherDay } from './utils/weatherContext.ts';
import MobileWardrobeView from './components/MobileWardrobeView.tsx';


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
  const [showSetsModal, setShowSetsModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [showWornOutfitsModal, setShowWornOutfitsModal] = useState(false);
  const [showModelProfileModal, setShowModelProfileModal] = useState(false); // État pour la modale profil
  const { weatherInfo, weatherError, weatherMaxToday, tomorrowForecast } = useWeather();
  const [weatherDay, setWeatherDay] = useState<WeatherDay>(() => getDefaultWeatherDay());
  const prevItemCountRef = useRef(0);

  const [generatingVisualFor, setGeneratingVisualFor] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isWornOutfitsOpen, setIsWornOutfitsOpen] = useState(false);
  const [anchorItemForGeneration, setAnchorItemForGeneration] = useState<ClothingItem | ClothingSet | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOutfit, setChatOutfit] = useState<OutfitSuggestion | null>(null);
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [previousModalBeforeChat, setPreviousModalBeforeChat] = useState<'outfit' | 'favorites' | 'worn' | null>(null);

  // Ref pour l'AbortController de l'analyse de garde-robe
  const wardrobeAnalysisAbortRef = useRef<AbortController | null>(null);

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
    dislikedOutfits,
    addDislikedOutfit,
    deleteDislikedOutfit,
    userModelImage,
    recordOutfitWear,
    getItemWearCount,
    getWornOutfitsLast7Days,
    loading
  } = useWardrobe();

  const { toast, visible: toastVisible, showToast } = useToast();
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
    showToast('Retiré des favoris');
  } else {
    // Mutuellement exclusif avec les tenues à éviter : la même tenue ne
    // peut pas être à la fois un signal positif et négatif pour le style.
    const existingDislike = dislikedOutfits.find(
      (d) => d.titre === outfit.titre && d.description === outfit.description
    );
    if (existingDislike) {
      deleteDislikedOutfit(existingDislike.id);
    }
    addFavoriteOutfit(outfit);
    showToast('Ajouté aux favoris ❤️');
  }
}, [favoriteOutfits, dislikedOutfits, addFavoriteOutfit, deleteFavoriteOutfit, deleteDislikedOutfit, showToast]);

  const handleToggleDislike = useCallback((outfit: OutfitSuggestion) => {
  const existingDislike = dislikedOutfits.find(
    (d) => d.titre === outfit.titre && d.description === outfit.description
  );

  if (existingDislike) {
    deleteDislikedOutfit(existingDislike.id);
    showToast('Retiré des tenues à éviter');
  } else {
    const existingFavorite = favoriteOutfits.find(
      (fav) => fav.titre === outfit.titre && fav.description === outfit.description
    );
    if (existingFavorite) {
      deleteFavoriteOutfit(existingFavorite.id);
    }
    addDislikedOutfit(outfit);
    showToast('Noté, on évitera ce genre de tenue 👎');
  }
}, [dislikedOutfits, favoriteOutfits, addDislikedOutfit, deleteDislikedOutfit, deleteFavoriteOutfit, showToast]);

  const handleSelectOutfit = useCallback((outfit: OutfitSuggestion) => {
    const isAlreadySelected = selectedOutfit?.titre === outfit.titre && selectedOutfit?.description === outfit.description;

    if (isAlreadySelected) {
      setSelectedOutfit(null);
      showToast('Sélection annulée');
    } else {
      setSelectedOutfit(outfit);
      showToast('Tenue choisie ✨');

      // Enregistrer le port de la tenue dans l'historique
      const itemIds = outfit.vetements.map(item => item.id);
      recordOutfitWear(outfit.titre, outfit.description, itemIds);
    }
  }, [selectedOutfit, recordOutfitWear, showToast]);
  
  const safeClothingSets = React.useMemo(() => clothingSets || [], [clothingSets]);
  const itemIdsInSets = React.useMemo(() => new Set(safeClothingSets.flatMap(s => s.itemIds || [])), [safeClothingSets]);

  const wornOutfitsLast7Days = useMemo(() => getWornOutfitsLast7Days(), [getWornOutfitsLast7Days]);

  const handleGenerateOutfits = useCallback(async (occasion: string, anchorItem?: ClothingItem | ClothingSet) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements.");
      return;
    }
    setIsGenerating(true);
    setError(null);

    // Utiliser l'ancre depuis l'état si aucune n'est passée en paramètre
    const effectiveAnchor = anchorItem || anchorItemForGeneration;

    const enrichedWeather = buildWeatherContext(weatherDay, weatherInfo, weatherMaxToday, tomorrowForecast);
    const fullContext = enrichedWeather
      ? `${getWeatherDayLabel(weatherDay)} : ${enrichedWeather}. Occasion : ${occasion}`
      : `Occasion : ${occasion}`;

    try {
      // Note : le dernier paramètre est la météo de référence pour les
      // contraintes dures (short si < 22°C, etc.) — la météo actuelle en
      // mode "aujourd'hui", ou la prévision du matin en mode "demain" (voir
      // outfitConstraints.ts et weatherContext.ts).
      const referenceWeatherInfo = buildReferenceWeatherInfo(weatherDay, weatherInfo, tomorrowForecast);
      const outfits = await generateOutfits(safeClothingItems, safeClothingSets, fullContext, effectiveAnchor || undefined, wornOutfitsLast7Days, favoriteOutfits, referenceWeatherInfo, dislikedOutfits);
      setSuggestedOutfits(outfits);
      setAnchorItemForGeneration(null); // Réinitialiser l'ancre après génération
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsGenerating(false);
    }
  }, [safeClothingItems, safeClothingSets, weatherInfo, weatherMaxToday, weatherDay, tomorrowForecast, anchorItemForGeneration, wornOutfitsLast7Days, favoriteOutfits, dislikedOutfits]);

  const handleGenerateVariants = useCallback(async (outfit: OutfitSuggestion, itemsToReplace: OutfitItem[]) => {
    if (safeClothingItems.length === 0) {
      setError("Veuillez d'abord ajouter des vêtements.");
      return;
    }
    setIsGenerating(true);
    setError(null);

    const enrichedWeather = buildWeatherContext(weatherDay, weatherInfo, weatherMaxToday, tomorrowForecast);
    const fullContext = enrichedWeather
      ? `${getWeatherDayLabel(weatherDay)} : ${enrichedWeather}. Contexte original : ${outfit.description}`
      : `Contexte original : ${outfit.description}`;

    try {
      // Mêmes contraintes dures que la génération initiale, voir
      // outfitConstraints.ts et weatherContext.ts.
      const referenceWeatherInfo = buildReferenceWeatherInfo(weatherDay, weatherInfo, tomorrowForecast);
      const variants = await generateOutfitVariants(safeClothingItems, safeClothingSets, fullContext, outfit, itemsToReplace, referenceWeatherInfo);
      setSuggestedOutfits(variants);
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsGenerating(false);
    }
  }, [safeClothingItems, safeClothingSets, weatherInfo, weatherMaxToday, weatherDay, tomorrowForecast]);

  const handleOpenChat = useCallback((outfit: OutfitSuggestion) => {
    setChatOutfit(outfit);
    setChatMessages([]);

    // Sauvegarder quelle modale était ouverte pour la réouvrir après
    if (showOutfitModal) {
      setPreviousModalBeforeChat('outfit');
    } else if (showFavoriteModal) {
      setPreviousModalBeforeChat('favorites');
    } else if (showWornOutfitsModal) {
      setPreviousModalBeforeChat('worn');
    }

    // Fermer les modales pour éviter l'empilement
    setShowOutfitModal(false);
    setShowFavoriteModal(false);
    setShowWornOutfitsModal(false);

    // Ouvrir le chat
    setShowChatModal(true);
  }, [showOutfitModal, showFavoriteModal, showWornOutfitsModal]);

  const handleChatMessage = useCallback(async (message: string, history: ChatMessage[]) => {
    if (!chatOutfit) return;

    // Mettre à jour les messages pour inclure le message de l'utilisateur
    setChatMessages(history);

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

    // Créer un nouvel AbortController pour cette analyse
    wardrobeAnalysisAbortRef.current = new AbortController();

    setIsAnalyzingWardrobe(true);
    setError(null);
    try {
      const analysis = await analyzeWardrobeGaps(
        safeClothingItems,
        safeClothingSets,
        wardrobeAnalysisAbortRef.current.signal
      );
      setWardrobeAnalysis(analysis);
    } catch (err) {
      // Ne pas afficher d'erreur si c'est une annulation volontaire
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(getUserFriendlyError(err));
    } finally {
      setIsAnalyzingWardrobe(false);
      wardrobeAnalysisAbortRef.current = null;
    }
  }, [safeClothingItems, safeClothingSets]);

  const handleCancelWardrobeAnalysis = useCallback(() => {
    if (wardrobeAnalysisAbortRef.current) {
      wardrobeAnalysisAbortRef.current.abort();
    }
  }, []);


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
      showToast("Ajoutez une photo de vous pour l'essayage 📸");
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
  }, [safeClothingItems, userModelImage, showToast]);

 
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

  const handleAnalyzeClothingItems = useCallback((files: File[]) => {
    analyzeClothingItems(files).catch(err => setError(getUserFriendlyError(err)));
  }, [analyzeClothingItems]);

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

  // Bundle de props répété sur tous les affichages de tenues (OutfitDisplay,
  // OutfitModal, VacationModal, FavoriteOutfitsModal, WornOutfitsModal...)
  const outfitInteractionProps = {
    favoriteOutfits,
    dislikedOutfits,
    onToggleFavorite: handleToggleFavorite,
    onToggleDislike: handleToggleDislike,
    onGenerateVisual: handleGenerateVisual,
    generatingVisualFor,
    selectedOutfit,
    onSelectOutfit: handleSelectOutfit,
    onGenerateVariants: handleGenerateVariants,
    isGenerating,
    onOpenChat: handleOpenChat,
  };

  const categoryCounts = {
    hauts: safeClothingItems.filter(item => item.category === 'Hauts').length,
    bas: safeClothingItems.filter(item => item.category === 'Bas').length,
    chaussures: safeClothingItems.filter(item => item.category === 'Chaussures').length,
    accessoires: safeClothingItems.filter(item => item.category === 'Accessoires').length,
  };

  const mobileFilters = useMobileWardrobeFilters(safeClothingItems, activeTab);

  const isModalOpen =
    showOutfitModal ||
    showVacationModal ||
    showSetModal ||
    showSetsModal ||
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
  const prevItemCount = prevItemCountRef.current;
  if (!isAnalyzing && safeClothingItems.length > prevItemCount && prevItemCount > 0) {
    const addedCount = safeClothingItems.length - prevItemCount;
    showToast(`${addedCount} vêtement${addedCount > 1 ? 's' : ''} ajouté${addedCount > 1 ? 's' : ''} ✨`);
  }
  prevItemCountRef.current = safeClothingItems.length;
}, [isAnalyzing, safeClothingItems.length, showToast]);
  
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAnalyzeWardrobe}
                  disabled={isAnalyzingWardrobe}
                  className="px-4 md:px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-onyx rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
                >
                  {isAnalyzingWardrobe && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isAnalyzingWardrobe ? 'Analyse...' : 'Analyser ma garde-robe'}
                </button>
                {isAnalyzingWardrobe && (
                  <button
                    onClick={handleCancelWardrobeAnalysis}
                    className="px-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all text-sm font-medium"
                    title="Annuler l'analyse"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          )}
          
        
          <div className="hidden md:block">
            <ClothingUpload onAnalyze={handleAnalyzeClothingItems} isAnalyzing={isAnalyzing} />
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'home' ? (
                  <MobileHome
                    onAnalyzeWardrobe={handleAnalyzeWardrobe}
                    onCancelWardrobeAnalysis={handleCancelWardrobeAnalysis}
                    onScrollToOutfits={handleScrollToOutfits}
                    onScrollToVacation={handleScrollToVacation}
                    onShowSets={() => setShowSetsModal(true)}
                    onShowFavorites={() => setShowFavoriteModal(true)}
                    onShowWornOutfits={() => setShowWornOutfitsModal(true)}
                    isAnalyzingWardrobe={isAnalyzingWardrobe}
                    clothingCount={safeClothingItems.length}
                    favoriteOutfitCount={favoriteOutfits.length}
                    wornOutfitCount={wornOutfitsLast7Days.length}
                    setsCount={safeClothingSets.length}
                  />
                ) : (
                  <MobileWardrobeView
                    activeTab={activeTab}
                    itemIdsInSets={itemIdsInSets}
                    onItemClick={handleItemClick}
                    filters={mobileFilters}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
        </div>
        
        <div className="lg:col-span-1 space-y-10 lg:sticky lg:top-40 hidden md:block">
            <div id="outfit-generator">
              <OutfitGenerator
                onGenerate={handleGenerateOutfits}
                isGenerating={isGenerating}
                weatherInfo={weatherInfo}
                weatherError={weatherError}
                weatherMaxToday={weatherMaxToday}
                weatherDay={weatherDay}
                onChangeWeatherDay={setWeatherDay}
                tomorrowForecast={tomorrowForecast}
                anchorItem={anchorItemForGeneration}
                onClearAnchor={() => setAnchorItemForGeneration(null)}
              />
            </div>
            {suggestedOutfits.length > 0 && (
                  <OutfitDisplay
                    outfits={suggestedOutfits}
                    allClothingItems={safeClothingItems}
                    allClothingSets={safeClothingSets}
                    {...outfitInteractionProps}
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
          {...outfitInteractionProps}
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
              const cleanId = id ? id.trim() : '';

              // 1. Recherche par ID exact dans les items
              let item = safeClothingItems.find(ci => ci.id === cleanId);
              if (item) {
                return { id: item.id, description: item.analysis };
              }

              // 2. Recherche par ID exact dans les ensembles
              let set = safeClothingSets.find(cs => cs.id === cleanId);
              if (set) {
                return { id: set.id, description: set.name };
              }

              // 3. Recherche avec trim sur les deux côtés
              item = safeClothingItems.find(ci => ci.id.trim() === cleanId);
              if (item) {
                return { id: item.id, description: item.analysis };
              }

              set = safeClothingSets.find(cs => cs.id.trim() === cleanId);
              if (set) {
                return { id: set.id, description: set.name };
              }

              // 4. Recherche si l'article fait partie d'un set
              for (const currentSet of safeClothingSets) {
                if (currentSet.itemIds && currentSet.itemIds.includes(cleanId)) {
                  return { id: currentSet.id, description: currentSet.name };
                }
              }

              // Si l'item n'existe vraiment plus
              return { id: id, description: 'Article supprimé' };
            })
          }))}
          allClothingItems={safeClothingItems}
          allClothingSets={safeClothingSets}
          {...outfitInteractionProps}
        />
      </div>
    )}
  </div>
)}

            <div id="vacation-planner">
              <VacationPlanner
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
        onFilesSelected={handleAnalyzeClothingItems}
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
        suggestedOutfits={suggestedOutfits}
        onClose={() => {
          setShowOutfitModal(false);
          setAnchorItemForGeneration(null); // Effacer l'ancre si l'utilisateur ferme sans générer
        }}
        weatherInfo={weatherInfo}
        weatherError={weatherError}
        weatherMaxToday={weatherMaxToday}
        weatherDay={weatherDay}
        onChangeWeatherDay={setWeatherDay}
        tomorrowForecast={tomorrowForecast}
        anchorItem={anchorItemForGeneration}
        onClearAnchor={() => setAnchorItemForGeneration(null)}
        {...outfitInteractionProps}
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
        onClose={() => {
          setShowChatModal(false);
          // Réouvrir la modale qui était ouverte avant le chat
          if (previousModalBeforeChat === 'outfit') {
            setShowOutfitModal(true);
          } else if (previousModalBeforeChat === 'favorites') {
            setShowFavoriteModal(true);
          } else if (previousModalBeforeChat === 'worn') {
            setShowWornOutfitsModal(true);
          }
          setPreviousModalBeforeChat(null);
        }}
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

      <ClothingSetsModal
        open={showSetsModal}
        onClose={() => setShowSetsModal(false)}
        clothingSets={safeClothingSets}
        clothingItems={safeClothingItems}
        onCreateNewSet={() => {
          setShowSetsModal(false);
          setShowSetModal(true);
        }}
        onDeleteSet={handleRemoveSet}
      />

      <FavoriteOutfitsModal
        open={showFavoriteModal}
        onClose={() => setShowFavoriteModal(false)}
        allClothingItems={safeClothingItems}
        allClothingSets={safeClothingSets}
        {...outfitInteractionProps}
      />

      <WornOutfitsModal
        open={showWornOutfitsModal}
        onClose={() => setShowWornOutfitsModal(false)}
        allClothingItems={safeClothingItems}
        allClothingSets={safeClothingSets}
        wornOutfits={wornOutfitsLast7Days}
        {...outfitInteractionProps}
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
  <div className={`fixed bottom-32 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-opacity duration-300 ${toastVisible ? 'opacity-100' : 'opacity-0'}`}>
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
