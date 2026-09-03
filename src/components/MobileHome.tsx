import React from 'react';
import { LinkIcon, HeartIcon, MagicWandIcon, SuitcaseIcon } from './icons.tsx';

interface MobileHomeProps {
  onAnalyzeWardrobe: () => void;
  onCancelWardrobeAnalysis: () => void;
  onScrollToOutfits: () => void;
  onScrollToVacation: () => void;
  onShowSets: () => void;
  onShowFavorites: () => void;
  onShowWornOutfits: () => void;
  isAnalyzingWardrobe: boolean;
  clothingCount: number;
  favoriteOutfitCount: number;
  wornOutfitCount: number;
  setsCount: number;
}

const MobileHome: React.FC<MobileHomeProps> = ({
  onAnalyzeWardrobe,
  onCancelWardrobeAnalysis,
  onScrollToOutfits,
  onScrollToVacation,
  onShowSets,
  onShowFavorites,
  onShowWornOutfits,
  isAnalyzingWardrobe,
  clothingCount,
  favoriteOutfitCount,
  wornOutfitCount,
  setsCount
}) => {
  
  return (
    <div className="space-y-4 pb-24">
      {/* Header (inchangé) */}
      <div className="text-center py-6">
        <h2 className="text-3xl font-serif font-bold mb-2">
          <span className="text-gold">Ma</span> Garde-Robe
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {clothingCount} vêtement{clothingCount > 1 ? 's' : ''} dans votre collection
        </p>
      </div>

      {/* Feature Cards (inchangé) */}
      <div className="space-y-3 px-4">
        {/* ... (Les cartes Analyser, Créateur de tenues, Planificateur restent ici) ... */}
        {clothingCount >= 3 && (
          <div className="w-full bg-gradient-to-r from-gold/10 to-gold-dark/10 border-2 border-gold/30 rounded-2xl p-5 transition-all">
            <button
              onClick={onAnalyzeWardrobe}
              disabled={isAnalyzingWardrobe}
              className="w-full text-left transition-transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
                  {isAnalyzingWardrobe ? (
                    <svg className="animate-spin h-6 w-6 text-onyx" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-onyx" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">💡 Analyser ma garde-robe</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isAnalyzingWardrobe
                      ? "Analyse en cours..."
                      : "Découvrez quelles pièces acheter pour plus de polyvalence"}
                  </p>
                  {!isAnalyzingWardrobe && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ⏱️ ~30 secondes
                    </p>
                  )}
                </div>
              </div>
            </button>
            {isAnalyzingWardrobe && (
              <button
                onClick={onCancelWardrobeAnalysis}
                className="mt-3 w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all text-sm font-medium"
              >
                Annuler l'analyse
              </button>
            )}
          </div>
        )}

        {/* Créateur de Tenues */}
        <button
          onClick={onScrollToOutfits}
          className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MagicWandIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">✨ Créateur de Tenues</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Générez des looks personnalisés avec l'IA
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                ⏱️ 30-60 secondes
              </p>
            </div>
          </div>
        </button>

        {/* Planificateur de Valise */}
        <button
          onClick={onScrollToVacation}
          className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <SuitcaseIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">🧳 Planificateur de Valise</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Préparez votre valise optimale pour votre voyage
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                ⏱️ 30-60 secondes
              </p>
            </div>
          </div>
        </button>
      </div>


      {/* 4. MODIFIER LA CARTE "APERÇU RAPIDE" */}
      <div className="px-4 pt-6">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
          <h4 className="font-semibold mb-3 text-sm text-gray-600 dark:text-gray-400">
            Aperçu rapide
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {/* Carte Tenues portées (7 derniers jours) */}
            <button
              onClick={onShowWornOutfits}
              className="bg-white dark:bg-raisin-black rounded-xl p-3 text-center flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-raisin-black/50 transition-colors active:scale-95"
            >
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold">{wornOutfitCount}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Portées (7j)</p>
            </button>

            {/* Carte "Ensembles" */}
            <button
              onClick={onShowSets}
              className="bg-white dark:bg-raisin-black rounded-xl p-3 text-center flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-raisin-black/50 transition-colors active:scale-95"
            >
              <div className="text-green-500">
                <LinkIcon />
              </div>
              <p className="text-2xl font-bold">{setsCount}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Ensembles</p>
            </button>

            {/* Carte Favorites */}
            <button
              onClick={onShowFavorites}
              className="bg-white dark:bg-raisin-black rounded-xl p-3 text-center flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-raisin-black/50 transition-colors active:scale-95"
            >
              <div className="text-red-500">
                <HeartIcon />
              </div>
              <p className="text-2xl font-bold">{favoriteOutfitCount}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Favorites</p>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
