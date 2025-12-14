import React, { useState, useEffect, memo } from 'react';
import type { OutfitSuggestion, ClothingItem, ClothingSet, OutfitItem, FavoriteOutfit } from '../types.ts';
import { QuestionMarkIcon, XIcon, HeartIcon, HeartIconSolid, MagicWandIcon, LoadingSpinner } from './icons.tsx';

// FEATURE FLAG: Fonctionnalité de génération visuelle désactivée temporairement
// TODO: Réactiver quand une solution viable sera trouvée
const ENABLE_VISUAL_GENERATION = false;

interface OutfitDisplayProps {
  outfits: OutfitSuggestion[] | FavoriteOutfit[];
  allClothingItems: ClothingItem[];
  allClothingSets: ClothingSet[];
  favoriteOutfits: FavoriteOutfit[];
  onToggleFavorite: (outfit: OutfitSuggestion) => void;
  onGenerateVisual: (outfit: OutfitSuggestion) => void;
  generatingVisualFor: string | null;
  selectedOutfit: OutfitSuggestion | null;
  onSelectOutfit: (outfit: OutfitSuggestion) => void;
  onGenerateVariants: (outfit: OutfitSuggestion, itemToReplace: OutfitItem) => void;
  isGenerating: boolean;
}

const OutfitDisplay: React.FC<OutfitDisplayProps> = ({
  outfits,
  allClothingItems,
  allClothingSets,
  favoriteOutfits,
  onToggleFavorite,
  onGenerateVisual,
  generatingVisualFor,
  selectedOutfit,
  onSelectOutfit,
  onGenerateVariants,
  isGenerating
}) => {

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingOutfitIndex, setEditingOutfitIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; 
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [selectedImage]);

  // --- FONCTION DE RECHERCHE CORRIGÉE ---
  const findItemByIdOrDescription = (item: OutfitItem) => {
    const { id, description } = item;
    const cleanId = id ? id.trim() : '';
    // On nettoie la description pour la recherche
    const cleanDesc = description ? description.trim().toLowerCase() : '';

    // 1. Recherche par ID Exact (Priorité absolue)
    let foundItem = allClothingItems.find(ci => ci.id === cleanId);
    if (foundItem) return foundItem;

    // 2. Recherche dans les Sets par ID
    let foundSet = allClothingSets.find(cs => cs.id === cleanId);
    if (foundSet) return foundSet;

    // 3. Recherche inversée : L'IA a mis la description dans le champ ID
    if (cleanId) {
        foundItem = allClothingItems.find(ci => ci.analysis.toLowerCase().includes(cleanId.toLowerCase()));
        if (foundItem) return foundItem;
    }

    // 4. Recherche floue par Description
    if (cleanDesc) {
        foundItem = allClothingItems.find(ci => {
            const analysis = ci.analysis.toLowerCase();
            return analysis.includes(cleanDesc) || cleanDesc.includes(analysis);
        });
        if (foundItem) return foundItem;
    }

    return undefined; 
  };

  return (
    <>
      <div className="mt-10 space-y-8">
        {outfits.map((outfit, index) => {
          const isFavorite = favoriteOutfits.some(
            (fav) => fav.titre === outfit.titre && fav.description === outfit.description
          );
          const isLoadingVisual = generatingVisualFor === outfit.titre;
          const isSelected = selectedOutfit?.titre === outfit.titre && selectedOutfit?.description === outfit.description;

          return (
            <div key={index} className={`bg-snow dark:bg-onyx border-2 rounded-lg p-5 transition-all duration-300 hover:shadow-lg relative ${
              isSelected
                ? 'border-gold shadow-gold/30 shadow-lg'
                : 'border-black/10 dark:border-white/10 hover:border-gold/50'
            }`}>
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold-dark text-onyx px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Tenue choisie
                </div>
              )}
              <div className="flex justify-between items-start">
                  <h3 className="font-serif font-bold text-xl text-gold">{outfit.titre}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectOutfit(outfit)}
                      className={`p-1.5 transition-colors ${
                        isSelected
                          ? 'text-gold'
                          : 'text-gray-400 hover:text-gold dark:hover:text-gold'
                      }`}
                      aria-label={isSelected ? "Désélectionner cette tenue" : "Choisir cette tenue"}
                      title={isSelected ? "Désélectionner cette tenue" : "Choisir cette tenue"}
                    >
                      <svg className="w-6 h-6" fill={isSelected ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingOutfitIndex(editingOutfitIndex === index ? null : index)}
                      disabled={isGenerating}
                      className={`p-1.5 transition-colors ${
                        editingOutfitIndex === index
                          ? 'text-gold'
                          : 'text-gray-400 hover:text-gold dark:hover:text-gold'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label={editingOutfitIndex === index ? "Annuler la modification" : "Modifier cette tenue"}
                      title={editingOutfitIndex === index ? "Annuler la modification" : "Modifier cette tenue"}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {/* FONCTIONNALITÉ DÉSACTIVÉE: Génération visuelle sur mannequin
                        Raison: Solution Replicate non viable
                        TODO: Réactiver quand une meilleure solution sera trouvée */}
                    {ENABLE_VISUAL_GENERATION && (
                      <button
                        onClick={() => onGenerateVisual(outfit)}
                        disabled={isLoadingVisual}
                        className="p-1.5 text-gray-400 hover:text-gold dark:hover:text-gold transition-colors disabled:cursor-not-allowed"
                        aria-label="Générer un rendu visuel"
                        title="Générer un rendu visuel"
                      >
                        {isLoadingVisual ? <LoadingSpinner className="h-5 w-5" /> : <MagicWandIcon />}
                      </button>
                    )}
                    <button
                      onClick={() => onToggleFavorite(outfit)}
                      className="p-1.5 text-gray-400 hover:text-gold dark:hover:text-gold transition-colors"
                      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      {isFavorite ? <HeartIconSolid className="w-6 h-6 text-gold" /> : <HeartIcon className="w-6 h-6" />}
                    </button>
                  </div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{outfit.description}</p>

              {editingOutfitIndex === index && (
                <div className="mb-4 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                  <p className="text-sm text-gold-dark dark:text-gold font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cliquez sur une pièce pour la remplacer
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mb-5">
                {outfit.vetements.map((item, itemIndex) => {
                  const itemData = findItemByIdOrDescription(item);
                  const imgSrc = itemData ? itemData.imageSrc : null;
                  const isEditMode = editingOutfitIndex === index;

                  return (
                    <div key={itemIndex} className="relative">
                      <button
                        onClick={() => imgSrc && !isEditMode && setSelectedImage(imgSrc)}
                        className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-md shadow-md border-2 border-white dark:border-raisin-black overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold dark:focus:ring-offset-onyx disabled:cursor-default disabled:hover:scale-100 relative group"
                        disabled={!imgSrc || isEditMode}
                        aria-label={`Agrandir l'image de : ${item.description}`}
                        title={item.description}
                      >
                        {imgSrc ? (
                          <img src={imgSrc} alt={item.description} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-1 text-center">
                            <QuestionMarkIcon />
                          </div>
                        )}
                      </button>

                      {isEditMode && imgSrc && (
                        <button
                          onClick={() => {
                            onGenerateVariants(outfit, item);
                            setEditingOutfitIndex(null);
                          }}
                          disabled={isGenerating}
                          className="absolute inset-0 flex items-center justify-center bg-onyx/80 backdrop-blur-sm rounded-md transition-all hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed group"
                          aria-label={`Remplacer ${item.description}`}
                          title={`Remplacer ${item.description}`}
                        >
                          <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <ul className="list-disc list-inside space-y-1.5 text-sm pt-4 border-t border-black/5 dark:border-white/10">
                {outfit.vetements.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700 dark:text-gray-300">{item.description}</li>
                ))}
              </ul>
            </div>
          ); 
        })}  
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-onyx/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Vue agrandie" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-raisin-black/90 border-2 border-white/50 rounded-full text-white hover:bg-red-500 hover:border-white hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold shadow-lg"
              aria-label="Fermer"
            >
              <XIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(OutfitDisplay);
