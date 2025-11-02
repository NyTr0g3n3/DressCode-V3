import React, { useState, useEffect } from 'react';
import type { OutfitSuggestion, ClothingItem } from '../types.ts';
import { QuestionMarkIcon, XIcon } from './icons.tsx';

interface OutfitDisplayProps {
  outfits: OutfitSuggestion[];
  allClothingItems: ClothingItem[];
}

const OutfitDisplay: React.FC<OutfitDisplayProps> = ({ outfits, allClothingItems }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Gère la fermeture de la lightbox (vue agrandie)
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Empêche le défilement de l'arrière-plan

    // Fonction de nettoyage
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [selectedImage]);


  const findItemImage = (itemDescription: string): string | null => {
    const normalizedDescription = itemDescription.toLowerCase();
    
    const bestMatch = allClothingItems.find(ci => {
      // Priorité à la correspondance exacte
      if (ci.analysis.toLowerCase() === normalizedDescription) {
        return true;
      }
      // Vérification simple de la superposition des mots
      const itemWords = new Set(ci.analysis.toLowerCase().split(/\s+/));
      const descWords = normalizedDescription.split(/\s+/);
      const overlap = descWords.filter(word => itemWords.has(word));
      return overlap.length / descWords.length > 0.5; // au moins 50% de mots en commun
    });

    return bestMatch ? bestMatch.imageSrc : null;
  };

  return (
    <>
      <div className="mt-10 space-y-8">
        {outfits.map((outfit, index) => (
          <div key={index} className="bg-snow dark:bg-onyx border border-black/10 dark:border-white/10 rounded-lg p-5 transition-all duration-300 hover:shadow-lg hover:border-gold/50">
            <h3 className="font-serif font-bold text-xl text-gold">{outfit.titre}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">{outfit.description}</p>
            
            <div className="flex flex-wrap gap-3 mb-5">
              {outfit.vetements.map((itemDesc, itemIndex) => {
                const imgSrc = findItemImage(itemDesc);
                return (
                  <button 
                    key={itemIndex} 
                    onClick={() => imgSrc && setSelectedImage(imgSrc)}
                    className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-md shadow-md border-2 border-white dark:border-raisin-black overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold dark:focus:ring-offset-onyx disabled:cursor-default disabled:hover:scale-100"
                    disabled={!imgSrc}
                    aria-label={`Agrandir l'image de : ${itemDesc}`}
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt={itemDesc} className="w-full h-full object-cover" />
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
              {outfit.vetements.map((itemDesc, itemIndex) => (
                <li key={itemIndex} className="text-gray-700 dark:text-gray-300">{itemDesc}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Lightbox Modal (vue agrandie) */}
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