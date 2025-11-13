import React from 'react';
// On importe bien 'OutfitItem' et 'ClothingSet'
import type { VacationPlan, ClothingItem, ClothingSet, OutfitItem } from '../types.ts';
import { QuestionMarkIcon } from './icons.tsx';

interface VacationResultDisplayProps {
  plan: VacationPlan;
  allClothingItems: ClothingItem[];
  allClothingSets: ClothingSet[]; 
  onCreateSet: (name: string, itemIds: string[]) => void;
}

const VacationResultDisplay: React.FC<VacationResultDisplayProps> = ({ plan, allClothingItems, allClothingSets }) => {

  const findItemByIdOrDescription = (item: OutfitItem) => {
    const { id, description } = item;
    
    // 1. Recherche par ID (méthode préférée)
    let foundItem = allClothingItems.find(ci => ci.id === id);
    if (foundItem) return foundItem;

    let foundSet = allClothingSets.find(cs => cs.id === id);
    if (foundSet) return foundSet;

    // 2. Fallback: Recherche par description (si l'IA a mis la description dans le champ 'id')
    foundItem = allClothingItems.find(ci => ci.analysis === id);
    if (foundItem) return foundItem;
    
    // 3. Fallback: Recherche par description (si l'IA a bien suivi le champ 'description')
    foundItem = allClothingItems.find(ci => ci.analysis === description);
    if (foundItem) return foundItem;

    return undefined; // Introuvable
  };

  return (
    <div className="mt-10">
        <div className="bg-snow dark:bg-onyx border border-black/10 dark:border-white/10 rounded-lg p-5">
            <h3 className="font-serif font-bold text-xl text-gold">{plan.titre}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">{plan.resume}</p>
            
            <div className="flex flex-wrap gap-3 mb-5">
              {plan.valise.map((item, itemIndex) => {

                const itemData = findItemByIdOrDescription(item);
  
                const imgSrc = itemData ? itemData.imageSrc : null;
                return (
                  <div 
                    key={itemIndex} 
                    className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-md shadow-md border-2 border-white dark:border-raisin-black overflow-hidden relative group"
                    title={item.description}
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt={item.description} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-1 text-center">
                        <QuestionMarkIcon />
                      </div>
                    )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <p className="text-white text-xs text-center line-clamp-3">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <ul className="list-disc list-inside space-y-1.5 text-sm pt-4 border-t border-black/5 dark:border-white/10">
              {plan.valise.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-700 dark:text-gray-300">{item.description}</li>
              ))}
            </ul>
        </div>
    </div>
  );
};

export default VacationResultDisplay;
