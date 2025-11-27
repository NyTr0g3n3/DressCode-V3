import React, { useEffect, useRef } from 'react'; // 'useState' n'est pas nécessaire ici
import { BottomSheet } from 'react-spring-bottom-sheet';
import OutfitGenerator from './OutfitGenerator';
import OutfitDisplay from './OutfitDisplay';
import type { ClothingItem, ClothingSet, OutfitSuggestion, FavoriteOutfit } from '../types';

interface OutfitModalProps {
  open: boolean;
  clothingItems: ClothingItem[];
  clothingSets: ClothingSet[];
  onGenerate: (occasion: string) => void;
  isGenerating: boolean;
  suggestedOutfits: OutfitSuggestion[];
  onClose: () => void;
  weatherInfo: string | null;
  weatherError: string | null;
  favoriteOutfits: FavoriteOutfit[];
  onToggleFavorite: (outfit: OutfitSuggestion) => void;
  onGenerateVisual: (outfit: OutfitSuggestion) => void;
  generatingVisualFor: string | null;
}

const OutfitModal: React.FC<OutfitModalProps> = ({ 
  open,
  clothingItems,
  clothingSets,
  onGenerate, 
  isGenerating,
  suggestedOutfits,
  onClose,
  weatherInfo,
  weatherError,
  favoriteOutfits,
  onToggleFavorite,
  onGenerateVisual,
  generatingVisualFor
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isGenerating && suggestedOutfits.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [isGenerating, suggestedOutfits.length]);

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      className={isDarkMode ? 'dark' : ''}
      
      header={
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-raisin-black dark:text-snow">✨ Créateur de Tenues</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
      
      defaultSnap={({ maxHeight }) => maxHeight * 0.65}
      snapPoints={({ minHeight, maxHeight }) => [
        minHeight, 
        maxHeight * 0.65, 
        maxHeight * 0.85
      ]}
    >
      <div className="p-6 space-y-6 bg-white dark:bg-raisin-black text-raisin-black dark:text-snow">
        <OutfitGenerator 
          clothingItems={clothingItems}
          clothingSets={clothingSets}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          weatherInfo={weatherInfo}
          weatherError={weatherError}
        />

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-10 w-10 text-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">L'IA compose vos tenues...</p>
          </div>
        )}

       

        <div ref={resultsRef}>
        
          {suggestedOutfits.length > 0 && (
            <OutfitDisplay 
              outfits={suggestedOutfits} 
              allClothingItems={clothingItems} 
              allClothingSets={clothingSets} 
              favoriteOutfits={favoriteOutfits}
              onToggleFavorite={onToggleFavorite}
              onGenerateVisual={onGenerateVisual}
              generatingVisualFor={generatingVisualFor}
            />
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default OutfitModal;
