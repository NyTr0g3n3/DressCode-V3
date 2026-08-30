import React from 'react';
import type { ClothingItem, MobileTab } from '../types';
import type { useMobileWardrobeFilters } from '../hooks/useMobileWardrobeFilters';
import { LinkIcon, HeartIconSolid, ChevronDownIcon, SearchIcon, SortIcon } from './icons.tsx';

interface MobileWardrobeViewProps {
  activeTab: Exclude<MobileTab, 'home'>;
  itemIdsInSets: Set<string>;
  onItemClick: (item: ClothingItem) => void;
  filters: ReturnType<typeof useMobileWardrobeFilters>;
}

// Vue garde-robe mobile pour un onglet catégorie (Hauts/Bas/Chaussures/
// Accessoires) : recherche, tri, filtres Type/Couleur/Matière et grille.
const MobileWardrobeView: React.FC<MobileWardrobeViewProps> = ({ activeTab, itemIdsInSets, onItemClick, filters }) => {
  const {
    filteredItems,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    colorFilter, setColorFilter,
    materialFilter, setMaterialFilter,
    subcategoryFilter, setSubcategoryFilter,
    availableColors, availableMaterials, availableSubcategories,
  } = filters;

  return (
    <div className="pb-24">
      {/* Header avec titre */}
      <div className="text-center py-4 px-4">
        <h2 className="text-2xl font-bold mb-1 capitalize">{activeTab}</h2>
        <p className="text-sm text-gray-500">
          {filteredItems.length} vêtement{filteredItems.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Barre de recherche et tri */}
      <div className="px-4 pb-4 space-y-3">
        {/* Recherche */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Effacer"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tri */}
        <div className="relative">
          <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none cursor-pointer transition-all"
          >
            <option value="favorites">Favoris d'abord</option>
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="color">Couleur (A-Z)</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtres Type/Couleur/Matière */}
        <div className="space-y-3">
          {(colorFilter !== 'Toutes' || materialFilter !== 'Toutes' || subcategoryFilter !== 'Toutes') && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setColorFilter('Toutes');
                  setMaterialFilter('Toutes');
                  setSubcategoryFilter('Toutes');
                }}
                className="text-sm font-medium text-gold hover:text-gold-dark transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
          {/* Filtre Type (pour toutes les catégories) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none cursor-pointer transition-all text-sm"
            >
              {availableSubcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>

          {/* Filtres Couleur et Matière */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Couleur</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none cursor-pointer transition-all text-sm"
              >
                {availableColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Matière</label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-raisin-black border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none cursor-pointer transition-all text-sm"
              >
                {availableMaterials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-transform"
            >
              {item.isFavorite ? (
                <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-red-500 z-10">
                  <HeartIconSolid className="w-4 h-4" />
                </span>
              ) : itemIdsInSets.has(item.id) ? (
                <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white z-10">
                  <LinkIcon />
                </span>
              ) : null}

              <div className="aspect-square">
                <img
                  src={item.imageSrc}
                  alt={item.analysis}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium line-clamp-2">{item.analysis}</p>
                <p className="text-xs text-gray-500 mt-1">{item.color}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          {searchQuery ? (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 font-medium">Aucun résultat pour "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-gold font-medium"
              >
                Effacer la recherche
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">👕</div>
              <p className="text-gray-500 font-medium">Aucun vêtement dans cette catégorie</p>
              <p className="text-sm text-gray-400 mt-2">Appuyez sur + pour en ajouter</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileWardrobeView;
