import React from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import OutfitDisplay from './OutfitDisplay';
import type { ClothingItem, ClothingSet, OutfitSuggestion, FavoriteOutfit, OutfitItem } from '../types';

interface FavoriteOutfitsModalProps {
  open: boolean;
  onClose: () => void;
  allClothingItems: ClothingItem[];
  allClothingSets: ClothingSet[];
  favoriteOutfits: FavoriteOutfit[];
  onToggleFavorite: (outfit: OutfitSuggestion) => void;
  onGenerateVisual: (outfit: OutfitSuggestion) => void;
  generatingVisualFor: string | null;
  selectedOutfit: OutfitSuggestion | null;
  onSelectOutfit: (outfit: OutfitSuggestion) => void;
  onGenerateVariants?: (outfit: OutfitSuggestion, itemToReplace: OutfitItem) => void;
  isGenerating?: boolean;
  onOpenChat?: (outfit: OutfitSuggestion) => void;
}

const FavoriteOutfitsModal: React.FC<FavoriteOutfitsModalProps> = ({
  open,
  onClose,
  allClothingItems,
  allClothingSets,
  favoriteOutfits,
  onToggleFavorite,
  onGenerateVisual,
  generatingVisualFor,
  selectedOutfit,
  onSelectOutfit,
  onGenerateVariants,
  isGenerating,
  onOpenChat
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      className={isDarkMode ? 'dark' : ''}
      
      header={
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-raisin-black dark:text-snow">💖 Tenues Favorites</h2>
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
snapPoints={({ maxHeight }) => [
  maxHeight * 0.65,
  maxHeight * 0.85
]}
    >
      <div className="p-6 bg-white dark:bg-raisin-black text-raisin-black dark:text-snow">
        {favoriteOutfits.length > 0 ? (
          <OutfitDisplay
            outfits={favoriteOutfits}
            allClothingItems={allClothingItems}
            allClothingSets={allClothingSets}
            favoriteOutfits={favoriteOutfits}
            onToggleFavorite={onToggleFavorite}
            onGenerateVisual={onGenerateVisual}
            generatingVisualFor={generatingVisualFor}
            selectedOutfit={selectedOutfit}
            onSelectOutfit={onSelectOutfit}
            onGenerateVariants={onGenerateVariants}
            isGenerating={isGenerating}
            onOpenChat={onOpenChat}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Vous n'avez pas encore de tenues favorites.</p>
            <p className="text-sm text-gray-400 mt-2">Cliquez sur le cœur 🤍 sur une tenue générée pour l'ajouter.</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default FavoriteOutfitsModal;
