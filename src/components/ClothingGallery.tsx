import React, { useState, useMemo } from 'react';
import type { ClothingItem as ClothingItemType, ClothingSet, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard } from './SkeletonCard';
import { RemoveIcon, WardrobeIcon, TshirtIcon, PantIcon, ShoeIcon, AccessoryIcon, ChevronDownIcon, CheckCircleIcon, LinkIcon, HeartIconSolid } from './icons.tsx';

interface CardProps {
  imageSrc: string;
  analysis: string;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  isSelected: boolean;
  isSet?: boolean;
  isFavorite?: boolean; // <-- AJOUTER CETTE LIGNE
}

// ▼▼▼ MODIFICATION ICI (JSX de la Card) ▼▼▼
const Card: React.FC<CardProps> = ({ imageSrc, analysis, onClick, onRemove, isSelected, isSet, isFavorite }) => (
  <div onClick={onClick} className="group relative aspect-square bg-raisin-black rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
    <img 
  src={imageSrc} 
  alt={analysis} 
  loading="lazy"
  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
/>
    
    <div className={`absolute inset-0 transition-all duration-300 ${isSelected ? 'ring-4 ring-gold' : 'ring-2 ring-transparent'} rounded-lg`}></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
    
    {/* Logique d'icône priorisée */}
    {isSelected ? (
      <span className="absolute top-2 left-2 p-1.5 bg-gold rounded-full text-onyx z-10"><CheckCircleIcon /></span>
    ) : isFavorite ? (
      <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-red-500 z-10"><HeartIconSolid /></span>
    ) : isSet ? (
      <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white z-10"><LinkIcon /></span>
    ) : null}

    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-white text-sm font-medium line-clamp-2">{analysis}</p>
    </div>
    <button
      onClick={onRemove}
      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
      aria-label="Supprimer"
    >
      <RemoveIcon />
    </button>
  </div>
);
// ▲▲▲ FIN DE LA MODIFICATION ▲▲▲

interface ClothingGalleryProps {
  clothingItems: ClothingItemType[];
  clothingSets?: ClothingSet[];
  onItemClick: (item: ClothingItemType) => void;
  onDeleteItem: (id: string) => void;
  onCreateSet: (name: string, itemIds: string[]) => void;
  isLoading: boolean;
}

const initialFilters: Record<Category, { color: string; material: string }> = {
  Hauts: { color: 'Toutes', material: 'Toutes' },
  Bas: { color: 'Toutes', material: 'Toutes' },
  Chaussures: { color: 'Toutes', material: 'Toutes' },
  Accessoires: { color: 'Toutes', material: 'Toutes' },
};

const ClothingGallery: React.FC<ClothingGalleryProps> = ({ clothingItems, isLoading, clothingSets = [], onItemClick, onDeleteItem, onCreateSet }) => {
  const [openCategory, setOpenCategory] = useState<Category | null>('Hauts');
  const [filters, setFilters] = useState(initialFilters);
  
  const [isSetCreationMode, setIsSetCreationMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const safeClothingSets = useMemo(() => clothingSets || [], [clothingSets]);
  const itemIdsInSets = useMemo(() => new Set(safeClothingSets.flatMap(s => s.itemIds || [])), [safeClothingSets]);
  const totalItemsCount = clothingItems.length;

  const categories: { name: Category; icon: JSX.Element }[] = [
  { name: 'Hauts', icon: <TshirtIcon /> },
  { name: 'Bas', icon: <PantIcon /> },
  { name: 'Chaussures', icon: <ShoeIcon /> },
  { name: 'Accessoires', icon: <AccessoryIcon /> },
];

  const handleCardClick = (item: ClothingItemType) => {
    if (isSetCreationMode) {
      setSelectedItemIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      onItemClick(item);
    }
  };

  const handleRemoveItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (selectedItemIds.has(itemId)) {
      setSelectedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
    onDeleteItem(itemId);
  };

  const filteredItems = useMemo(() => {
    return clothingItems.filter(item => {
      const categoryMatch = item.category === openCategory;
      if (!categoryMatch) return false;

      const categoryFilters = openCategory ? filters[openCategory] : { color: 'Toutes', material: 'Toutes' };
      const colorMatch = categoryFilters.color === 'Toutes' || item.color === categoryFilters.color;
      const materialMatch = categoryFilters.material === 'Toutes' || item.material === categoryFilters.material;

      return colorMatch && materialMatch;
    });
  }, [clothingItems, openCategory, filters]);

  const availableColors = useMemo(() => {
    if (!openCategory) return [];
    const colorsInCategory = clothingItems
      .filter(item => item.category === openCategory)
      .map(item => item.color);
    return ['Toutes', ...Array.from(new Set(colorsInCategory))];
  }, [clothingItems, openCategory]);

  const availableMaterials = useMemo(() => {
    if (!openCategory) return [];
    const materialsInCategory = clothingItems
      .filter(item => item.category === openCategory)
      .map(item => item.material);
    return ['Toutes', ...Array.from(new Set(materialsInCategory))];
  }, [clothingItems, openCategory]);

  const handleColorChange = (color: string) => {
    if (!openCategory) return;
    setFilters(prev => ({ ...prev, [openCategory]: { ...prev[openCategory], color } }));
  };

  const handleMaterialChange = (material: string) => {
    if (!openCategory) return;
    setFilters(prev => ({ ...prev, [openCategory]: { ...prev[openCategory], material } }));
  };

  const handleToggleCategory = (categoryName: Category) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  const handleToggleSetMode = () => {
    setIsSetCreationMode(!isSetCreationMode);
    setSelectedItemIds(new Set());
  };

  const handleConfirmSetCreation = () => {
    if (selectedItemIds.size < 2) {
      alert("Veuillez sélectionner au moins 2 articles pour créer un ensemble.");
      return;
    }
    const setName = window.prompt("Donnez un nom à cet ensemble :");
    if (setName) {
      onCreateSet(setName, Array.from(selectedItemIds));
      handleToggleSetMode();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (totalItemsCount === 0) {
    return (
      <div className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 p-8 text-center">
        <WardrobeIcon className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-3 text-gray-700 dark:text-gray-300">Votre garde-robe est vide</h2>
        <p className="text-gray-500 dark:text-gray-400">Ajoutez vos premiers vêtements pour commencer à créer vos tenues !</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <WardrobeIcon className="w-8 h-8 text-gold" />
          <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight">
              <span className="text-gold">Ma</span> Garde-Robe
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalItemsCount} vêtement{totalItemsCount > 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {!isSetCreationMode ? (
          <button
            onClick={handleToggleSetMode}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-onyx dark:bg-snow border-2 border-gold text-gold dark:text-onyx font-bold rounded-lg hover:bg-gold/10 dark:hover:bg-onyx/10 transition-all duration-300 text-sm"
          >
            <LinkIcon />
            Créer un ensemble
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleToggleSetMode}
              className="flex-shrink-0 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmSetCreation}
              disabled={selectedItemIds.size < 2}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-all duration-300 text-sm disabled:opacity-50"
            >
              Valider ({selectedItemIds.size})
            </button>
          </div>
        )}
      </div>

      {isSetCreationMode && (
        <div className="bg-gold/10 border border-gold/30 text-gold-dark dark:text-gold p-4 rounded-lg mb-6 text-center">
          <p className="font-semibold">Mode Création d'Ensemble</p>
          <p className="text-sm">Sélectionnez les articles que vous souhaitez lier.</p>
        </div>
      )}

      <div className="space-y-6">
        {categories.map(({ name, icon }) => {
          const itemsInCategory = clothingItems.filter(item => item.category === name);
          const isOpen = openCategory === name;

          return (
            <div key={name} className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggleCategory(name)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 text-gold">{icon}</span>
                  <span className="font-semibold text-lg">{name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({itemsInCategory.length})</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">Couleur</label>
                      <select
                        value={filters[name].color}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      >
                        {availableColors.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">Matière</label>
                      <select
                        value={filters[name].material}
                        onChange={(e) => handleMaterialChange(e.target.value)}
                        className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      >
                        {availableMaterials.map(material => (
                          <option key={material} value={material}>{material}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredItems.length > 0 ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    <AnimatePresence mode='popLayout'>
      {filteredItems.map((item, index) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.05, 
            type: "spring",
            bounce: 0.3
          }}
        >
          <Card
            imageSrc={item.imageSrc}
            analysis={item.analysis}
            onClick={() => handleCardClick(item)}
            onRemove={(e) => handleRemoveItem(e, item.id)}
            isSelected={selectedItemIds.has(item.id)}
            isSet={itemIdsInSets.has(item.id)}
            isFavorite={item.isFavorite}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Aucun vêtement ne correspond aux filtres sélectionnés.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClothingGallery;
