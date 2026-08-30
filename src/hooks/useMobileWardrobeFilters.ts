import { useEffect, useMemo, useState } from 'react';
import type { Category, ClothingItem, MobileTab } from '../types';
import { SUBCATEGORIES } from '../utils/subcategoryClassifier';

export type MobileSortOption = 'favorites' | 'newest' | 'oldest' | 'color';

const TAB_TO_CATEGORY: Partial<Record<MobileTab, Category>> = {
  hauts: 'Hauts',
  bas: 'Bas',
  chaussures: 'Chaussures',
  accessoires: 'Accessoires',
};

/**
 * Recherche, tri et filtres (couleur/matière/type) pour la vue garde-robe
 * mobile (un onglet = une catégorie). Les filtres se réinitialisent à
 * chaque changement d'onglet.
 */
export function useMobileWardrobeFilters(items: ClothingItem[], activeTab: MobileTab) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MobileSortOption>('favorites');
  const [colorFilter, setColorFilter] = useState('Toutes');
  const [materialFilter, setMaterialFilter] = useState('Toutes');
  const [subcategoryFilter, setSubcategoryFilter] = useState('Toutes');

  useEffect(() => {
    setColorFilter('Toutes');
    setMaterialFilter('Toutes');
    setSubcategoryFilter('Toutes');
    setSearchQuery('');
  }, [activeTab]);

  const itemsInCategory = useMemo(() => {
    const category = TAB_TO_CATEGORY[activeTab];
    if (!category) return [];
    return items.filter(item => item.category === category);
  }, [items, activeTab]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'home') return [];

    let result = itemsInCategory;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.analysis.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        item.material.toLowerCase().includes(query)
      );
    }

    if (colorFilter !== 'Toutes') {
      result = result.filter(item => item.color === colorFilter);
    }
    if (materialFilter !== 'Toutes') {
      result = result.filter(item => item.material === materialFilter);
    }
    if (subcategoryFilter !== 'Toutes') {
      result = result.filter(item => item.subcategory === subcategoryFilter);
    }

    return [...result].sort((a, b) => {
      // Trier d'abord par sous-catégorie (pour toutes les catégories)
      const subcatA = a.subcategory || 'zzz';
      const subcatB = b.subcategory || 'zzz';
      const subcatCompare = subcatA.localeCompare(subcatB);
      if (subcatCompare !== 0) return subcatCompare;

      // Tri secondaire selon l'option sélectionnée
      switch (sortBy) {
        case 'favorites':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'color':
          return a.color.localeCompare(b.color);
        default:
          return 0;
      }
    });
  }, [activeTab, itemsInCategory, searchQuery, colorFilter, materialFilter, subcategoryFilter, sortBy]);

  const availableColors = useMemo(() => {
    if (activeTab === 'home') return [];
    return ['Toutes', ...Array.from(new Set(itemsInCategory.map(item => item.color)))];
  }, [activeTab, itemsInCategory]);

  const availableMaterials = useMemo(() => {
    if (activeTab === 'home') return [];
    return ['Toutes', ...Array.from(new Set(itemsInCategory.map(item => item.material)))];
  }, [activeTab, itemsInCategory]);

  const availableSubcategories = useMemo(() => {
    const category = TAB_TO_CATEGORY[activeTab];
    if (!category) return ['Toutes'];
    const subcategories = SUBCATEGORIES[category];
    if (!subcategories || subcategories.length === 0) return ['Toutes'];
    return ['Toutes', ...subcategories];
  }, [activeTab]);

  return {
    filteredItems,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    colorFilter, setColorFilter,
    materialFilter, setMaterialFilter,
    subcategoryFilter, setSubcategoryFilter,
    availableColors, availableMaterials, availableSubcategories,
  };
}
