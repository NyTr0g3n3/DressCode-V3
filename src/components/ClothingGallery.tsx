import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ClothingItem as ClothingItemType, ClothingSet, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard } from './SkeletonCard';
import { RemoveIcon, WardrobeIcon, TshirtIcon, PantIcon, ShoeIcon, AccessoryIcon, ChevronDownIcon, CheckCircleIcon, LinkIcon, HeartIconSolid, SearchIcon, SortIcon, EyeSlashIcon } from './icons.tsx';
import { classifyItems, SUBCATEGORIES } from '../utils/subcategoryClassifier';

interface CardProps {
  imageSrc: string;
  analysis: string;
  onClick: () => void;
  onPreview?: (imageSrc: string, analysis: string) => void;
  onCancelPreview?: () => void;
  isSelected: boolean;
  isSet?: boolean;
  isFavorite?: boolean;
  isExcluded?: boolean;
}

const Card: React.FC<CardProps> = ({ imageSrc, analysis, onClick, onPreview, onCancelPreview, isSelected, isSet, isFavorite, isExcluded }) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (onPreview) {
        onPreview(imageSrc, analysis);
      }
    }, 500); // 500ms pour déclencher le long-press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPressing) {
      onClick();
    }
    setIsLongPressing(false);
  };

  const handleMouseEnter = () => {
    if (onPreview && window.innerWidth >= 1024) { // Desktop only (lg breakpoint)
      onPreview(imageSrc, analysis);
    }
  };

  const handleMouseLeave = () => {
    if (onCancelPreview && window.innerWidth >= 1024) {
      onCancelPreview();
    }
  };

  return (
    <div
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative aspect-square bg-raisin-black rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    >
      <img
        src={imageSrc}
        alt={analysis}
        loading="lazy"
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${isExcluded ? 'opacity-40' : ''}`}
      />

    <div className={`absolute inset-0 transition-all duration-300 ${isSelected ? 'ring-4 ring-gold' : 'ring-2 ring-transparent'} rounded-lg`}></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

    {/* Overlay pour items exclus */}
    {isExcluded && (
      <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-[1px] flex items-center justify-center z-5">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-full p-3">
          <EyeSlashIcon className="w-8 h-8 text-gray-300" />
        </div>
      </div>
    )}

    {isSelected ? (
      <span className="absolute top-2 left-2 p-1.5 bg-gold rounded-full text-onyx z-10"><CheckCircleIcon /></span>
    ) : isFavorite ? (
      <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-red-500 z-10"><HeartIconSolid className="w-4 h-4" /></span>
    ) : isSet ? (
      <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white z-10"><LinkIcon /></span>
    ) : null}

    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-white text-sm font-medium line-clamp-2">{analysis}</p>
    </div>
  </div>
  );
};

type SortOption = 'favorites' | 'newest' | 'oldest' | 'color' | 'category';

interface ClothingGalleryProps {
  clothingItems: ClothingItemType[];
  clothingSets?: ClothingSet[];
  onItemClick: (item: ClothingItemType) => void;
  onDeleteItem: (id: string) => void;
  onCreateSet: (name: string, itemIds: string[]) => void;
  isLoading: boolean;
}

const initialFilters: Record<Category, { color: string; material: string; subcategory: string }> = {
  Hauts: { color: 'Toutes', material: 'Toutes', subcategory: 'Toutes' },
  Bas: { color: 'Toutes', material: 'Toutes', subcategory: 'Toutes' },
  Chaussures: { color: 'Toutes', material: 'Toutes', subcategory: 'Toutes' },
  Accessoires: { color: 'Toutes', material: 'Toutes', subcategory: 'Toutes' },
};

const ClothingGallery: React.FC<ClothingGalleryProps> = ({ clothingItems, isLoading, clothingSets = [], onItemClick, onDeleteItem, onCreateSet }) => {
  const [openCategory, setOpenCategory] = useState<Category | null>('Hauts');
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('favorites');

  const [isSetCreationMode, setIsSetCreationMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // État pour la preview d'image
  const [previewImage, setPreviewImage] = useState<{ src: string; description: string } | null>(null);
  const previewOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Appliquer la classification automatique des sous-catégories
  const classifiedItems = useMemo(() => classifyItems(clothingItems), [clothingItems]);

  const safeClothingSets = useMemo(() => clothingSets || [], [clothingSets]);
  const itemIdsInSets = useMemo(() => new Set(safeClothingSets.flatMap(s => s.itemIds || [])), [safeClothingSets]);
  const totalItemsCount = classifiedItems.length;

  const categories: { name: Category; icon: JSX.Element }[] = [
    { name: 'Hauts', icon: <TshirtIcon /> },
    { name: 'Bas', icon: <PantIcon /> },
    { name: 'Chaussures', icon: <ShoeIcon /> },
    { name: 'Accessoires', icon: <AccessoryIcon /> },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'favorites', label: 'Favoris d\'abord' },
    { value: 'newest', label: 'Plus récents' },
    { value: 'oldest', label: 'Plus anciens' },
    { value: 'color', label: 'Couleur (A-Z)' },
    { value: 'category', label: 'Catégorie' },
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

  // Fonction de tri
  const sortItems = (items: ClothingItemType[]): ClothingItemType[] => {
    return [...items].sort((a, b) => {
      // Tri primaire : par sous-catégorie (pour TOUTES les catégories)
      const subcatA = a.subcategory || 'zzz'; // Items sans subcategory à la fin
      const subcatB = b.subcategory || 'zzz';
      const subcatCompare = subcatA.localeCompare(subcatB);

      // Si les sous-catégories sont différentes, on trie par sous-catégorie
      if (subcatCompare !== 0) return subcatCompare;

      // Tri secondaire selon l'option sélectionnée par l'utilisateur
      switch (sortBy) {
        case 'favorites':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        case 'newest':
          // Items sans createdAt vont à la fin
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt - a.createdAt;
        case 'oldest':
          // Items sans createdAt vont à la fin
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return a.createdAt - b.createdAt;
        case 'color':
          return a.color.localeCompare(b.color);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  };

  // Filtrage global par recherche
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return classifiedItems;

    const query = searchQuery.toLowerCase();
    return classifiedItems.filter(item =>
      item.analysis.toLowerCase().includes(query) ||
      item.color.toLowerCase().includes(query) ||
      item.material.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(query))
    );
  }, [classifiedItems, searchQuery]);

 // Filtrage par catégorie, couleur, matière et sous-catégorie
const filteredItems = useMemo(() => {
  if (!openCategory) return [];

  const itemsInCategory = searchFilteredItems.filter(item => item.category === openCategory);
  const categoryFilters = filters[openCategory];

  if (!categoryFilters) return itemsInCategory;

  return itemsInCategory.filter(item => {
    const colorMatch = categoryFilters.color === 'Toutes' || item.color === categoryFilters.color;
    const materialMatch = categoryFilters.material === 'Toutes' || item.material === categoryFilters.material;
    const subcategoryMatch = !categoryFilters.subcategory || categoryFilters.subcategory === 'Toutes' || item.subcategory === categoryFilters.subcategory;
    return colorMatch && materialMatch && subcategoryMatch;
  });
}, [searchFilteredItems, openCategory, filters[openCategory]?.color, filters[openCategory]?.material, filters[openCategory]?.subcategory]);

  // Appliquer le tri
  const sortedFilteredItems = useMemo(() => sortItems(filteredItems), [filteredItems, sortBy, openCategory]);

  // Compter les items par catégorie (après recherche)
  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, { name }) => {
      acc[name] = searchFilteredItems.filter(item => item.category === name).length;
      return acc;
    }, {} as Record<Category, number>);
  }, [searchFilteredItems]);

  const availableColors = useMemo(() => {
    if (!openCategory) return [];
    const colorsInCategory = searchFilteredItems
      .filter(item => item.category === openCategory)
      .map(item => item.color);
    return ['Toutes', ...Array.from(new Set(colorsInCategory))];
  }, [searchFilteredItems, openCategory]);

  const availableMaterials = useMemo(() => {
    if (!openCategory) return [];
    const materialsInCategory = searchFilteredItems
      .filter(item => item.category === openCategory)
      .map(item => item.material);
    return ['Toutes', ...Array.from(new Set(materialsInCategory))];
  }, [searchFilteredItems, openCategory]);

  const availableSubcategories = useMemo(() => {
    if (!openCategory) {
      console.log('🔍 availableSubcategories: no openCategory');
      return [];
    }

    // Récupérer les sous-catégories disponibles pour la catégorie actuelle
    const subcategoriesForCategory = SUBCATEGORIES[openCategory];
    const result = !subcategoriesForCategory || subcategoriesForCategory.length === 0
      ? []
      : ['Toutes', ...subcategoriesForCategory];

    console.log('🔍 DEBUG availableSubcategories:', {
      openCategory,
      subcategoriesForCategory,
      'SUBCATEGORIES type': typeof SUBCATEGORIES,
      'SUBCATEGORIES keys': Object.keys(SUBCATEGORIES),
      'SUBCATEGORIES[openCategory]': SUBCATEGORIES[openCategory],
      hasSubcategories: !!subcategoriesForCategory,
      subcategoriesLength: subcategoriesForCategory?.length || 0,
      resultLength: result.length,
      result: result,
      'condition passes': result.length > 1
    });

    if (!subcategoriesForCategory || subcategoriesForCategory.length === 0) return [];

    return ['Toutes', ...subcategoriesForCategory];
  }, [openCategory]);

  const handleColorChange = (color: string) => {
    if (!openCategory) return;
    setFilters(prev => ({ ...prev, [openCategory]: { ...prev[openCategory], color } }));
  };

  const handleMaterialChange = (material: string) => {
    if (!openCategory) return;
    setFilters(prev => ({ ...prev, [openCategory]: { ...prev[openCategory], material } }));
  };

  const handleSubcategoryChange = (subcategory: string) => {
    if (!openCategory) return;
    setFilters(prev => ({ ...prev, [openCategory]: { ...prev[openCategory], subcategory } }));
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

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Gestion de la preview d'image
  const handlePreview = (imageSrc: string, description: string) => {
    // Clear any existing timeouts
    if (previewOpenTimeoutRef.current) {
      clearTimeout(previewOpenTimeoutRef.current);
    }
    if (previewCloseTimeoutRef.current) {
      clearTimeout(previewCloseTimeoutRef.current);
    }

    // Sur desktop, ajouter un petit délai pour éviter les previews accidentelles
    if (window.innerWidth >= 1024) {
      previewOpenTimeoutRef.current = setTimeout(() => {
        setPreviewImage({ src: imageSrc, description });
      }, 300);
    } else {
      // Sur mobile (long-press), afficher immédiatement
      setPreviewImage({ src: imageSrc, description });
    }
  };

  const handleCancelPreview = () => {
    // Cancel pending open if preview hasn't opened yet
    if (previewOpenTimeoutRef.current) {
      clearTimeout(previewOpenTimeoutRef.current);
    }

    // Schedule close with small delay to allow moving to preview
    previewCloseTimeoutRef.current = setTimeout(() => {
      setPreviewImage(null);
    }, 150);
  };

  const handlePreviewMouseEnter = () => {
    // Cancel close timeout if mouse enters preview area
    if (previewCloseTimeoutRef.current) {
      clearTimeout(previewCloseTimeoutRef.current);
    }
  };

  const closePreview = () => {
    if (previewOpenTimeoutRef.current) {
      clearTimeout(previewOpenTimeoutRef.current);
    }
    if (previewCloseTimeoutRef.current) {
      clearTimeout(previewCloseTimeoutRef.current);
    }
    setPreviewImage(null);
  };

  // Fermer la preview avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        closePreview();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewImage]);

  // Cleanup des timeouts au démontage
  useEffect(() => {
    return () => {
      if (previewOpenTimeoutRef.current) {
        clearTimeout(previewOpenTimeoutRef.current);
      }
      if (previewCloseTimeoutRef.current) {
        clearTimeout(previewCloseTimeoutRef.current);
      }
    };
  }, []);

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
    <>
      {/* Modal de preview d'image */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closePreview}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onMouseEnter={handlePreviewMouseEnter}
              onMouseLeave={handleCancelPreview}
              className="relative max-w-2xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique sur l'image
            >
              <img
                src={previewImage.src}
                alt={previewImage.description}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <p className="text-white text-sm font-medium">{previewImage.description}</p>
              </div>
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
                aria-label="Fermer la preview"
              >
                <RemoveIcon />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
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

      {/* Barre de recherche et tri */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Recherche */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par description, couleur, matière..."
            className="w-full pl-10 pr-10 py-2.5 bg-snow dark:bg-onyx border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Effacer la recherche"
            >
              <RemoveIcon />
            </button>
          )}
        </div>

        {/* Tri */}
        <div className="relative sm:w-48">
          <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full pl-10 pr-4 py-2.5 bg-snow dark:bg-onyx border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none cursor-pointer transition-all"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {searchFilteredItems.length} résultat{searchFilteredItems.length > 1 ? 's' : ''} pour "{searchQuery}"
        </div>
      )}

      {isSetCreationMode && (
        <div className="bg-gold/10 border border-gold/30 text-gold-dark dark:text-gold p-4 rounded-lg mb-6 text-center">
          <p className="font-semibold">Mode Création d'Ensemble</p>
          <p className="text-sm">Sélectionnez les articles que vous souhaitez lier.</p>
        </div>
      )}

      {/* Catégories */}
      <div className="space-y-6">
        {categories.map(({ name, icon }) => {
          const itemsInCategory = categoryCounts[name] || 0;
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
                  <span className="text-sm text-gray-500 dark:text-gray-400">({itemsInCategory})</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-6 space-y-6">
                  {/* Filtres couleur/matière/sous-catégorie */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[150px]">
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

                    <div className="flex-1 min-w-[150px]">
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

                    {/* Filtre sous-catégorie (pour toutes les catégories) */}
                    {availableSubcategories.length > 1 && (
                      <div className="flex-1 min-w-[150px]" style={{ border: '2px solid red' }}>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                          value={filters[name].subcategory}
                          onChange={(e) => handleSubcategoryChange(e.target.value)}
                          className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        >
                          {availableSubcategories.map(subcategory => (
                            <option key={subcategory} value={subcategory}>{subcategory}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Grille des vêtements */}
                  {sortedFilteredItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <AnimatePresence mode='popLayout'>
                        {sortedFilteredItems.map((item, index) => (
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
                              onPreview={handlePreview}
                              onCancelPreview={handleCancelPreview}
                              isSelected={selectedItemIds.has(item.id)}
                              isSet={itemIdsInSets.has(item.id)}
                              isFavorite={item.isFavorite}
                              isExcluded={item.isExcluded}
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
    </>
  );
};

export default ClothingGallery;
