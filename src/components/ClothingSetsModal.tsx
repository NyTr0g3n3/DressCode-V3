import React, { useState } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import type { ClothingItem, ClothingSet } from '../types';
import { LinkIcon } from './icons';

interface ClothingSetsModalProps {
  open: boolean;
  onClose: () => void;
  clothingSets: ClothingSet[];
  clothingItems: ClothingItem[];
  onCreateNewSet: () => void;
  onDeleteSet?: (setId: string) => void;
}

const ClothingSetsModal: React.FC<ClothingSetsModalProps> = ({
  open,
  onClose,
  clothingSets,
  clothingItems,
  onCreateNewSet,
  onDeleteSet
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  // Fonction pour retrouver un article par son ID
  const findItemById = (id: string): ClothingItem | undefined => {
    return clothingItems.find(item => item.id === id);
  };

  // Fonction pour obtenir les articles d'un ensemble
  const getSetItems = (set: ClothingSet): ClothingItem[] => {
    return set.itemIds
      .map(id => findItemById(id))
      .filter((item): item is ClothingItem => item !== undefined);
  };

  const handleDeleteSet = (setId: string) => {
    const confirmed = window.confirm("Voulez-vous vraiment supprimer cet ensemble ?");
    if (confirmed && onDeleteSet) {
      onDeleteSet(setId);
    }
  };

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      className={isDarkMode ? 'dark' : ''}
      header={
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-raisin-black dark:text-snow">🔗 Mes Ensembles</h2>
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
        {/* Bouton Créer un nouvel ensemble */}
        <button
          onClick={() => {
            onClose();
            onCreateNewSet();
          }}
          className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-gold text-onyx font-bold rounded-xl hover:bg-gold-dark transition-all duration-300 active:scale-98"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer un nouvel ensemble
        </button>

        {/* Liste des ensembles */}
        {clothingSets.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Vos ensembles enregistrés ({clothingSets.length})
            </p>

            {clothingSets.map(set => {
              const items = getSetItems(set);
              const isExpanded = expandedSetId === set.id;

              return (
                <div
                  key={set.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  {/* Header de l'ensemble */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-gold" />
                      <h3 className="font-bold text-lg">{set.name}</h3>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {items.length} article{items.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Bouton supprimer */}
                    {onDeleteSet && (
                      <button
                        onClick={() => handleDeleteSet(set.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500"
                        aria-label="Supprimer l'ensemble"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Mini-grille des articles */}
                  <div className="grid grid-cols-3 gap-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="relative aspect-square rounded-lg overflow-hidden shadow-md"
                      >
                        <img
                          src={item.imageSrc}
                          alt={item.analysis}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <p className="absolute bottom-1 left-1 right-1 text-white text-xs font-medium line-clamp-2">
                          {item.analysis}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-gray-500 font-medium">Vous n'avez pas encore créé d'ensemble.</p>
            <p className="text-sm text-gray-400 mt-2">
              Créez des ensembles pour lier des articles qui vont ensemble
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default ClothingSetsModal;
