import React from 'react';
import type { VacationPlan, ClothingItem } from '../types.ts';
import { QuestionMarkIcon } from './icons.tsx';

interface VacationResultDisplayProps {
  plan: VacationPlan;
  allClothingItems: ClothingItem[];
}

const VacationResultDisplay: React.FC<VacationResultDisplayProps> = ({ plan, allClothingItems }) => {

  const findItemImage = (itemDescription: string): string | null => {
    const normalizedDescription = itemDescription.toLowerCase();
    
    // Essayer de trouver une correspondance exacte d'abord
    const exactMatch = allClothingItems.find(ci => ci.analysis.toLowerCase() === normalizedDescription);
    if (exactMatch) return exactMatch.imageSrc;

    // Si pas de correspondance exacte, chercher le meilleur chevauchement
    const bestMatch = allClothingItems
      .map(ci => {
        const itemWords = new Set(ci.analysis.toLowerCase().split(/\s+/));
        const descWords = normalizedDescription.split(/\s+/);
        const overlap = descWords.filter(word => itemWords.has(word));
        const score = overlap.length / descWords.length;
        return { item: ci, score };
      })
      .filter(match => match.score > 0.5) // Seuil de confiance
      .sort((a, b) => b.score - a.score)[0];

    return bestMatch ? bestMatch.item.imageSrc : null;
  };

  return (
    <div className="mt-10">
        <div className="bg-snow dark:bg-onyx border border-black/10 dark:border-white/10 rounded-lg p-5">
            <h3 className="font-serif font-bold text-xl text-gold">{plan.titre}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">{plan.resume}</p>
            
            <div className="flex flex-wrap gap-3 mb-5">
              {plan.valise.map((itemDesc, itemIndex) => {
                const imgSrc = findItemImage(itemDesc);
                return (
                  <div 
                    key={itemIndex} 
                    className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-md shadow-md border-2 border-white dark:border-raisin-black overflow-hidden relative group"
                    title={itemDesc}
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt={itemDesc} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-1 text-center">
                        <QuestionMarkIcon />
                      </div>
                    )}
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <p className="text-white text-xs text-center line-clamp-3">{itemDesc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <ul className="list-disc list-inside space-y-1.5 text-sm pt-4 border-t border-black/5 dark:border-white/10">
              {plan.valise.map((itemDesc, itemIndex) => (
                <li key={itemIndex} className="text-gray-700 dark:text-gray-300">{itemDesc}</li>
              ))}
            </ul>
        </div>
    </div>
  );
};

export default VacationResultDisplay;