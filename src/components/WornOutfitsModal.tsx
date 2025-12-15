import React, { useMemo } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import OutfitDisplay from './OutfitDisplay';
import type { ClothingItem, ClothingSet, OutfitSuggestion, FavoriteOutfit, OutfitWearHistory, OutfitItem } from '../types';

interface WornOutfitsModalProps {
  open: boolean;
  onClose: () => void;
  allClothingItems: ClothingItem[];
  allClothingSets: ClothingSet[];
  wornOutfits: OutfitWearHistory[];
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

const WornOutfitsModal: React.FC<WornOutfitsModalProps> = ({
  open,
  onClose,
  allClothingItems,
  allClothingSets,
  wornOutfits,
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

  // Fonction de recherche intelligente d'article (similaire à OutfitDisplay)
  const findItemById = (id: string) => {
    const cleanId = id ? id.trim() : '';

    // 1. Recherche par ID exact dans les items individuels
    let foundItem = allClothingItems.find(ci => ci.id === cleanId);
    if (foundItem) return foundItem;

    // 2. Recherche par ID exact dans les ensembles
    let foundSet = allClothingSets.find(cs => cs.id === cleanId);
    if (foundSet) return foundSet;

    // 3. Recherche avec trim sur les deux côtés (au cas où il y aurait des espaces)
    foundItem = allClothingItems.find(ci => ci.id.trim() === cleanId);
    if (foundItem) return foundItem;

    foundSet = allClothingSets.find(cs => cs.id.trim() === cleanId);
    if (foundSet) return foundSet;

    // 4. Recherche dans les items qui pourraient être dans des sets
    // (au cas où l'article a été ajouté à un set après avoir été porté)
    for (const set of allClothingSets) {
      if (set.itemIds && set.itemIds.includes(cleanId)) {
        // L'article fait maintenant partie d'un set, on retourne le set
        return set;
      }
    }

    return undefined;
  };

  // Convertir OutfitWearHistory en OutfitSuggestion pour OutfitDisplay
  const outfitsToDisplay = useMemo(() => {
    return wornOutfits.map(history => {
      // Retrouver les items correspondants
      const vetements = history.itemIds.map(id => {
        const found = findItemById(id);

        if (found) {
          return {
            id: found.id,
            description: 'name' in found ? found.name : found.analysis
          };
        }

        // Si l'item n'existe vraiment plus, on garde juste l'ID
        return {
          id: id,
          description: 'Article supprimé'
        };
      });

      return {
        titre: history.outfitTitle,
        description: history.outfitDescription,
        vetements
      } as OutfitSuggestion;
    });
  }, [wornOutfits, allClothingItems, allClothingSets]);

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      className={isDarkMode ? 'dark' : ''}
      header={
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-raisin-black dark:text-snow">👔 Tenues Portées</h2>
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
        {outfitsToDisplay.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Vos tenues portées ces 7 derniers jours
            </p>
            <OutfitDisplay
              outfits={outfitsToDisplay}
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
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👔</div>
            <p className="text-gray-500 font-medium">Vous n'avez pas encore porté de tenue cette semaine.</p>
            <p className="text-sm text-gray-400 mt-2">
              Sélectionnez une tenue en cliquant sur ✓ pour l'ajouter à votre historique
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default WornOutfitsModal;
