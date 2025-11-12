import React, { useState } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import type { ClothingItem, ClothingSet, Category } from '../types';
import { CheckCircleIcon, LinkIcon } from './icons';

interface SetCreatorModalProps {
  clothingItems: ClothingItem[];
  clothingSets: ClothingSet[];
  open: boolean; // <-- La nouvelle prop 'open'
  onClose: () => void;
  onCreateSet: (name: string, itemIds: string[]) => void;
}

const SetCreatorModal: React.FC<SetCreatorModalProps> = ({ 
  open,
  clothingItems,
  clothingSets,
  onClose, 
  onCreateSet 
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  const itemIdsInSets = new Set(clothingSets.flatMap(s => s.itemIds));
  const availableItems = clothingItems.filter(item => !itemIdsInSets.has(item.id));
  
  const itemsByCategory = availableItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<Category, ClothingItem[]>);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreate = () => {
    if (selectedIds.size < 2) {
      alert("Veuillez sélectionner au moins 2 articles.");
      return;
    }
    const name = window.prompt("Donnez un nom à cet ensemble :");
    if (name) {
      onCreateSet(name, Array.from(selectedIds));
    }
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      className={isDarkMode ? 'dark' : ''} // Assure le thème
      
      header={
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-raisin-black dark:text-snow">🔗 Créer un ensemble</h2>
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
      
      footer={
        selectedIds.size > 0 && (
          <div className="p-4 border-t border-black/10 dark:border-white/10 bg-white dark:bg-raisin-black">
            <button
              onClick={handleCreate}
              disabled={selectedIds.size < 2}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              <LinkIcon />
              Lier {selectedIds.size} article{selectedIds.size > 1 ? 's' : ''}
            </button>
          </div>
        )
      }
      
      defaultSnap={({ minHeight }) => minHeight}
      snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight * 0.85]}
    >
      {/* Le contenu (enfant) est automatiquement scrollable */}
      <div className="p-4 bg-white dark:bg-raisin-black text-raisin-black dark:text-snow">
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
          Sélectionnez les articles que vous souhaitez lier (ex: une veste et son pantalon).
        </p>
        <div className="space-y-4">
          {(Object.keys(itemsByCategory) as Category[]).map(category => (
            itemsByCategory[category].length > 0 && (
              <div key={category}>
                <h3 className="font-semibold text-lg mb-2">{category}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {itemsByCategory[category].map(item => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-transform border-2"
                        style={{ borderColor: isSelected ? '#D4AF37' : 'transparent' }}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 bg-gold rounded-full text-onyx z-10">
                            <CheckCircleIcon />
                          </div>
                        )}
                        <div className="aspect-square">
                          <img 
                            src={item.imageSrc} 
                            alt={item.analysis} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <p className="absolute bottom-1 left-1 right-1 text-white text-xs font-medium line-clamp-2 p-1">
                          {item.analysis}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};

export default SetCreatorModal;
