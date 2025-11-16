import React, { useState, useEffect } from 'react';

import type { OutfitSuggestion, ClothingItem, ClothingSet, OutfitItem, FavoriteOutfit } from '../types.ts';
import { QuestionMarkIcon, XIcon, HeartIcon, HeartIconSolid, MagicWandIcon, LoadingSpinner } from './icons.tsx';


interface OutfitDisplayProps {
  outfits: OutfitSuggestion[] | FavoriteOutfit[];
  allClothingItems: ClothingItem[];
  allClothingSets: ClothingSet[];
  favoriteOutfits: FavoriteOutfit[];
  onToggleFavorite: (outfit: OutfitSuggestion) => void;
  onGenerateVisual: (outfit: OutfitSuggestion) => void;
  generatingVisualFor: string | null;
}


const OutfitDisplay: React.FC<OutfitDisplayProps> = ({ 
  outfits, 
  allClothingItems, 
  allClothingSets, 
  favoriteOutfits, 
  onToggleFavorite,
  onGenerateVisual,
  generatingVisualFor
}) => {

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; 


    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [selectedImage]);



  const findItemByIdOrDescription = (item: OutfitItem) => {
    const { id, description } = item;
    
    let foundItem = allClothingItems.find(ci => ci.id === id);
    if (foundItem) return foundItem;

    let foundSet = allClothingSets.find(cs => cs.id === id);
    if (foundSet) return foundSet;

  
    foundItem = allClothingItems.find(ci => ci.analysis === id);
    if (foundItem) return foundItem;
    
 
    foundItem = allClothingItems.find(ci => ci.analysis === description);
    if (foundItem) return foundItem;

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
          
          return (
            <div key={index} className="bg-snow dark:bg-onyx border border-black/10 dark:border-white/10 rounded-lg p-5 transition-all duration-300 hover:shadow-lg hover:border-gold/50">
              <div className="flex justify-between items-start">
                  <h3 className="font-serif font-bold text-xl text-gold">{outfit.titre}</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onGenerateVisual(outfit)}
                      disabled={isLoadingVisual}
                      className="p-1.5 text-gray-400 hover:text-gold dark:hover:text-gold transition-colors disabled:cursor-not-allowed"
                      aria-label="Générer un rendu visuel"
                      title="Générer un rendu visuel"
                    >
                      {isLoadingVisual ? (
                        <LoadingSpinner className="h-5 w-5" />
                      ) : (
                        <MagicWandIcon />
                      )}
                    </button>
                    <button 
                      onClick={() => onToggleFavorite(outfit)}
                      className="p-1.5 text-gray-400 hover:text-gold dark:hover:text-gold transition-colors"
                      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      {isFavorite ? (
                        <HeartIconSolid className="w-6 h-6 text-gold" />
                      ) : (
                        <HeartIcon className="w-6 h-6" />
                      )}
                    </button>
                  </div>
              </div> {/* <--- ▼▼▼ CETTE BALISE ÉTAIT MANQUANTE ▼▼▼ */}
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">{outfit.description}</p>
              
              <div className="flex flex-wrap gap-3 mb-5">
                {outfit.vetements.map((item, itemIndex) => {
                  const itemData = findItemByIdOrDescription(item);
                  const imgSrc = itemData ? itemData.imageSrc : null;
                  return (
                    <button 
                      key={itemIndex} 
                      onClick={() => imgSrc && setSelectedImage(imgSrc)}
                      className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-md shadow-md border-2 border-white dark:border-raisin-black overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold dark:focus:ring-offset-onyx disabled:cursor-default disabled:hover:scale-100"
                      disabled={!imgSrc}
                      aria-label={`Agrandir l'image de : ${item.description}`}
                    >
                      {imgSrc ? (
                        <img src={imgSrc} alt={item.description} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 text-center">
                          <QuestionMarkIcon />
                        </div>
                      )}
                    </button>
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
              className="absolute -top-3 -right-3 p-1.5 bg-raisin-black border-2 border-white dark:border-onyx rounded-full text-white hover:bg-red-500 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold"
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

export default OutfitDisplay;
