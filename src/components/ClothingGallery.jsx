import React, { useState, useMemo } from 'react';
import { RemoveIcon, WardrobeIcon, TshirtIcon, PantIcon, ShoeIcon, AccessoryIcon, ChevronDownIcon, CheckCircleIcon, LinkIcon, UnlinkIcon } from './icons.jsx';

const Card = ({ imageSrc, analysis, onClick, onRemove, isSelected, isSet }) => (
  <div onClick={onClick} className="group relative aspect-square bg-raisin-black rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
    <img src={imageSrc} alt={analysis} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
    <div className={`absolute inset-0 transition-all duration-300 ${isSelected ? 'ring-4 ring-gold' : 'ring-2 ring-transparent'} rounded-lg`}></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
    {isSet && !isSelected && <span className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white"><LinkIcon /></span>}
    {isSelected && <span className="absolute top-2 left-2 p-1.5 bg-gold rounded-full text-onyx"><CheckCircleIcon /></span>}
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

const initialFilters = {
  Hauts: { color: 'Toutes', material: 'Toutes' },
  Bas: { color: 'Toutes', material: 'Toutes' },
  Chaussures: { color: 'Toutes', material: 'Toutes' },
  Accessoires: { color: 'Toutes', material: 'Toutes' },
};

const ClothingGallery = ({ clothingItems, clothingSets, onRemoveItem, onRemoveSet, onSelectItem, onCreateSet }) => {
  const [openCategory, setOpenCategory] = useState('Hauts');
  const [filters, setFilters] = useState(initialFilters);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isNamingSet, setIsNamingSet] = useState(false);
  
  const itemIdsInSets = useMemo(() => new Set(clothingSets.flatMap(s => s.itemIds)), [clothingSets]);
  const totalItemsCount = clothingItems.length;

  const categories = [
    { name: 'Hauts', icon: TshirtIcon },
    { name: 'Bas', icon: PantIcon },
    { name: 'Chaussures', icon: ShoeIcon },
    { name: 'Accessoires', icon: AccessoryIcon },
  ];
  
  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItemIds([]);
    setIsNamingSet(false);
  };

  const handleCardClick = (item) => {
    if (selectMode) {
      setSelectedItemIds(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      onSelectItem(item);
    }
  };

  const matchingSet = useMemo(() => {
    if (selectedItemIds.length < 2) return null;
    return clothingSets.find(set => 
        set.itemIds.length === selectedItemIds.length &&
        set.itemIds.every(id => selectedItemIds.includes(id))
    );
  }, [selectedItemIds, clothingSets]);

  if (totalItemsCount === 0) {
    return (
      <div className="text-center py-20 px-6 bg-white dark:bg-raisin-black rounded-xl border border-dashed border-gray-300/50 dark:border-gray-700/50 flex flex-col items-center">
        <div className="text-gray-400 dark:text-gray-600 mb-4"><WardrobeIcon /></div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Votre garde-robe est vide.</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajoutez des vêtements pour commencer à créer.</p>
      </div>
    );
  }
  
  const toggleCategory = (category) => setOpenCategory(prev => (prev === category ? null : category));

  const handleFilterChange = (category, filterType, value) => {
    setFilters(prev => ({ ...prev, [category]: { ...prev[category], [filterType]: value } }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-serif font-bold">Ma Garde-Robe <span className="text-gray-500">({totalItemsCount})</span></h2>
        <button onClick={handleToggleSelectMode} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${selectMode ? 'bg-gold/20 text-gold' : 'bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700'}`}>
          {selectMode ? 'Annuler la sélection' : 'Créer un ensemble'}
        </button>
      </div>
      
      <div className="space-y-4">
        {categories.map(({ name, icon: Icon }) => {
          const itemsInCategory = clothingItems.filter(item => item.category === name);
          if (itemsInCategory.length === 0) return null;

          const isOpen = openCategory === name;
          const isFilterable = ['Hauts', 'Bas', 'Chaussures'].includes(name);
          const uniqueColors = [...new Set(itemsInCategory.map(item => item.color))].sort();
          const uniqueMaterials = [...new Set(itemsInCategory.map(item => item.material))].sort();
          
          const filteredItems = itemsInCategory.filter(item => {
            const { color, material } = filters[name];
            return (color === 'Toutes' || item.color === color) && (material === 'Toutes' || item.material === material);
          });

          return (
            <div key={name} className="bg-white dark:bg-raisin-black rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden transition-all duration-300">
              <button onClick={() => toggleCategory(name)} className="w-full flex justify-between items-center p-4 lg:p-5 text-left" aria-expanded={isOpen}>
                <div className="flex items-center gap-4">
                  <span className="text-gold"><Icon /></span>
                  <span className="font-serif font-bold text-xl text-raisin-black dark:text-snow">{name}</span>
                  <span className="text-sm font-medium bg-snow dark:bg-onyx px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{itemsInCategory.length}</span>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-4 lg:p-5 border-t border-black/5 dark:border-white/10">
                    {isFilterable && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor={`${name}-color-filter`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Couleur</label>
                          <select
                            id={`${name}-color-filter`}
                            value={filters[name].color}
                            onChange={(e) => handleFilterChange(name, 'color', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full appearance-none text-sm px-3 py-1.5 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors"
                          >
                            <option value="Toutes">Toutes</option>
                            {uniqueColors.map(color => <option key={color} value={color}>{color}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`${name}-material-filter`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Matière</label>
                          <select
                            id={`${name}-material-filter`}
                            value={filters[name].material}
                            onChange={(e) => handleFilterChange(name, 'material', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full appearance-none text-sm px-3 py-1.5 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors"
                          >
                            <option value="Toutes">Toutes</option>
                            {uniqueMaterials.map(material => <option key={material} value={material}>{material}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredItems.map((item) => (
                        <Card 
                          key={item.id} 
                          imageSrc={item.imageSrc}
                          analysis={item.analysis}
                          onClick={() => handleCardClick(item)} 
                          onRemove={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                          isSelected={selectMode && selectedItemIds.includes(item.id)}
                          isSet={itemIdsInSets.has(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4">
          {isNamingSet ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const setName = formData.get('setName');
                if (setName && setName.trim()) {
                  onCreateSet(selectedItemIds, setName.trim());
                  handleToggleSelectMode();
                }
              }} 
              className="flex items-center gap-2 bg-white dark:bg-raisin-black p-2 rounded-full shadow-2xl ring-1 ring-gold/50"
            >
              <input
                type="text"
                name="setName"
                placeholder="Nom de l'ensemble..."
                className="flex-grow bg-transparent px-4 py-1 text-onyx dark:text-snow focus:outline-none"
                autoFocus
              />
              <button type="submit" className="bg-gold text-onyx font-bold px-4 py-1.5 rounded-full hover:bg-gold-dark transition-colors">
                Créer
              </button>
              <button type="button" onClick={() => setIsNamingSet(false)} className="text-gray-500 dark:text-gray-400 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <RemoveIcon />
              </button>
            </form>
          ) : matchingSet ? (
            <button
              onClick={() => {
                onRemoveSet(matchingSet.id);
                handleToggleSelectMode();
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-rose-500 text-white font-bold rounded-full shadow-2xl hover:bg-rose-600 transition-all duration-300 transform hover:scale-105"
            >
              <UnlinkIcon />
              Dissocier l'ensemble
            </button>
          ) : selectedItemIds.length > 1 && (
            <button
              onClick={() => setIsNamingSet(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gold text-onyx font-bold rounded-full shadow-2xl hover:bg-gold-dark transition-all duration-300 transform hover:scale-105"
            >
              <LinkIcon />
              Créer un ensemble avec {selectedItemIds.length} articles
            </button>
          )}
        </div>
      )}

    </div>
  );
};

export default ClothingGallery;