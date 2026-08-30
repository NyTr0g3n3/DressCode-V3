import { describe, it, expect } from 'vitest';
import { parseTemperatureCelsius, filterOutfitsByHardConstraints } from './outfitConstraints';
import type { ClothingItem, ClothingSet, OutfitSuggestion } from '../types';

describe('parseTemperatureCelsius', () => {
  it('extrait la température du format produit par useWeather', () => {
    expect(parseTemperatureCelsius('18°C, ciel dégagé, à Paris')).toBe(18);
  });

  it('gère les températures négatives', () => {
    expect(parseTemperatureCelsius('-3°C, neige, à Grenoble')).toBe(-3);
  });

  it('retourne null si la météo est absente ou mal formée', () => {
    expect(parseTemperatureCelsius(null)).toBeNull();
    expect(parseTemperatureCelsius(undefined)).toBeNull();
    expect(parseTemperatureCelsius('Météo indisponible')).toBeNull();
  });
});

const tshirt: ClothingItem = {
  id: 'top-1', imageSrc: '', analysis: 'T-shirt blanc', category: 'Hauts', color: 'Blanc', material: 'Coton',
};
const jean: ClothingItem = {
  id: 'bottom-1', imageSrc: '', analysis: 'Jean brut', category: 'Bas', subcategory: 'Pantalons', color: 'Bleu', material: 'Denim',
};
const short: ClothingItem = {
  id: 'bottom-2', imageSrc: '', analysis: 'Short beige', category: 'Bas', subcategory: 'Shorts', color: 'Beige', material: 'Coton',
};
const sneakers: ClothingItem = {
  id: 'shoes-1', imageSrc: '', analysis: 'Sneakers blanches', category: 'Chaussures', color: 'Blanc', material: 'Cuir',
};
const allItems = [tshirt, jean, short, sneakers];

const completeOutfit: OutfitSuggestion = {
  titre: 'Look complet', description: '',
  vetements: [{ id: tshirt.id, description: tshirt.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
};

describe('filterOutfitsByHardConstraints', () => {
  it('garde une tenue complète et thermiquement cohérente', () => {
    const result = filterOutfitsByHardConstraints([completeOutfit], allItems, [], { temperatureCelsius: 20 });
    expect(result).toHaveLength(1);
  });

  it('écarte une tenue à qui il manque une catégorie (pas de chaussures)', () => {
    const incomplete: OutfitSuggestion = {
      titre: 'Sans chaussures', description: '',
      vetements: [{ id: tshirt.id, description: tshirt.analysis }, { id: jean.id, description: jean.analysis }],
    };
    const result = filterOutfitsByHardConstraints([incomplete], allItems, [], { temperatureCelsius: 20 });
    expect(result).toHaveLength(0);
  });

  it('écarte une tenue avec un short quand il fait moins de 22°C', () => {
    const shortsOutfit: OutfitSuggestion = {
      titre: 'Short par temps froid', description: '',
      vetements: [{ id: tshirt.id, description: tshirt.analysis }, { id: short.id, description: short.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([shortsOutfit], allItems, [], { temperatureCelsius: 15 });
    expect(result).toHaveLength(0);
  });

  it('garde une tenue avec un short quand il fait assez chaud', () => {
    const shortsOutfit: OutfitSuggestion = {
      titre: 'Short par temps chaud', description: '',
      vetements: [{ id: tshirt.id, description: tshirt.analysis }, { id: short.id, description: short.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([shortsOutfit], allItems, [], { temperatureCelsius: 25 });
    expect(result).toHaveLength(1);
  });

  it("n'applique pas la règle du short si la température est inconnue", () => {
    const shortsOutfit: OutfitSuggestion = {
      titre: 'Short, météo inconnue', description: '',
      vetements: [{ id: tshirt.id, description: tshirt.analysis }, { id: short.id, description: short.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([shortsOutfit], allItems, [], { temperatureCelsius: null });
    expect(result).toHaveLength(1);
  });

  it("écarte une tenue qui n'inclut pas l'article ancré", () => {
    const result = filterOutfitsByHardConstraints([completeOutfit], allItems, [], { temperatureCelsius: 20, anchorId: 'un-autre-item' });
    expect(result).toHaveLength(0);
  });

  it('garde une tenue qui inclut bien l\'article ancré', () => {
    const result = filterOutfitsByHardConstraints([completeOutfit], allItems, [], { temperatureCelsius: 20, anchorId: tshirt.id });
    expect(result).toHaveLength(1);
  });

  it('résout un ensemble (set) vers ses items constitutifs pour la vérification de structure', () => {
    const set: ClothingSet = { id: 'set-1', name: 'Ensemble complet', itemIds: [tshirt.id, jean.id, sneakers.id], imageSrc: '' };
    const outfitWithSet: OutfitSuggestion = {
      titre: 'Via un ensemble', description: '',
      vetements: [{ id: set.id, description: set.name }],
    };
    const result = filterOutfitsByHardConstraints([outfitWithSet], allItems, [set], { temperatureCelsius: 20 });
    expect(result).toHaveLength(1);
  });

  it('ne filtre que les tenues fautives, garde les autres', () => {
    const incomplete: OutfitSuggestion = {
      titre: 'Incomplète', description: '',
      vetements: [{ id: tshirt.id, description: tshirt.analysis }],
    };
    const result = filterOutfitsByHardConstraints([completeOutfit, incomplete], allItems, [], { temperatureCelsius: 20 });
    expect(result).toEqual([completeOutfit]);
  });
});
