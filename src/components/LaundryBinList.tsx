import React from 'react';
import type { ClothingItem } from '../types';
import { LaundryBasketIcon } from './icons';

interface LaundryBinListProps {
  dirtyItems: ClothingItem[];
  onMarkClean: (item: ClothingItem) => void;
}

// "Au bac depuis Xj" — même logique d'affichage que ClothingDetailModal.
function formatDirtyDuration(dirtySince: number): string {
  const days = Math.floor((Date.now() - dirtySince) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Depuis aujourd'hui";
  if (days === 1) return 'Depuis hier';
  return `Depuis ${days} jours`;
}

// Contenu partagé entre LaundryBinModal (mobile, dans une BottomSheet) et
// la section repliable desktop (App.tsx) — même liste sur les deux
// plateformes, cf. le même partage pour Favoris/Tenues Portées.
const LaundryBinList: React.FC<LaundryBinListProps> = ({ dirtyItems, onMarkClean }) => {
  // Plus récemment mis au bac en premier — les articles qui y traînent
  // depuis longtemps se retrouvent en bas, hors de vue immédiate, ce qui
  // est correct : ce sont les plus anciens qu'on a justement le plus de
  // chances d'avoir déjà lavés sans y repenser.
  const sortedItems = [...dirtyItems].sort((a, b) => (b.dirtySince ?? 0) - (a.dirtySince ?? 0));

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <LaundryBasketIcon className="w-16 h-16 text-gray-300 dark:text-gray-700" />
        </div>
        <p className="text-gray-500 font-medium">Le bac à linge est vide.</p>
        <p className="text-sm text-gray-400 mt-2">
          Depuis la fiche d'un article, mettez-le au bac pour l'exclure temporairement de vos tenues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Ces articles ne seront pas proposés dans vos tenues tant qu'ils sont ici ({sortedItems.length})
      </p>

      {sortedItems.map(item => (
        <div
          key={item.id}
          className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
        >
          <img
            src={item.imageSrc}
            alt={item.analysis}
            className="w-14 h-14 object-cover rounded-lg flex-shrink-0 opacity-60"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.analysis}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.dirtySince ? formatDirtyDuration(item.dirtySince) : ''}
            </p>
          </div>
          <button
            onClick={() => onMarkClean(item)}
            className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold bg-white dark:bg-onyx text-gold-dark dark:text-gold border border-gold/50 rounded-md hover:bg-gold hover:text-onyx dark:hover:bg-gold dark:hover:text-onyx transition-colors"
          >
            Propre ✓
          </button>
        </div>
      ))}
    </div>
  );
};

export default LaundryBinList;
