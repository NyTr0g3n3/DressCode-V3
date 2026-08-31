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
const zipSweater: ClothingItem = {
  id: 'top-2', imageSrc: '', analysis: 'Pull zippé bleu marine', category: 'Hauts', subcategory: 'Pulls', color: 'Bleu marine', material: 'Laine',
};
const zipSweaterUnclassified: ClothingItem = {
  id: 'top-3', imageSrc: '', analysis: 'Pull camionneur gris', category: 'Hauts', color: 'Gris', material: 'Laine',
};
const turtleneck: ClothingItem = {
  id: 'top-4', imageSrc: '', analysis: 'Pull col roulé noir', category: 'Hauts', subcategory: 'Pulls', color: 'Noir', material: 'Laine',
};
const shirt: ClothingItem = {
  id: 'top-5', imageSrc: '', analysis: 'Chemise blanche', category: 'Hauts', subcategory: 'Chemises', color: 'Blanc', material: 'Coton',
};
const colVPull: ClothingItem = {
  id: 'top-6', imageSrc: '', analysis: 'Pull col V beige', category: 'Hauts', subcategory: 'Pulls', color: 'Beige', material: 'Laine',
};
const crewNeckPull: ClothingItem = {
  id: 'top-7', imageSrc: '', analysis: 'Pull col rond vert', category: 'Hauts', subcategory: 'Pulls', color: 'Vert', material: 'Laine',
};
const allItems = [tshirt, jean, short, sneakers, zipSweater, zipSweaterUnclassified, turtleneck, shirt, colVPull, crewNeckPull];

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

  it('écarte une tenue avec un pull zippé sans rien dessous', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Pull zippé seul', description: '',
      vetements: [{ id: zipSweater.id, description: zipSweater.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(0);
  });

  it('garde une tenue avec un pull zippé porté sur un t-shirt', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Pull zippé + t-shirt', description: '',
      vetements: [{ id: zipSweater.id, description: zipSweater.analysis }, { id: tshirt.id, description: tshirt.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(1);
  });

  it('garde une tenue avec un pull zippé porté sur une chemise', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Pull zippé + chemise', description: '',
      vetements: [{ id: zipSweater.id, description: zipSweater.analysis }, { id: shirt.id, description: shirt.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(1);
  });

  it("écarte un pull sans sous-catégorie persistée mais détecté par sa description (fallback texte)", () => {
    const outfit: OutfitSuggestion = {
      titre: 'Pull camionneur seul', description: '',
      vetements: [{ id: zipSweaterUnclassified.id, description: zipSweaterUnclassified.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(0);
  });

  it('garde un col roulé porté seul (règle non concernée)', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Col roulé seul', description: '',
      vetements: [{ id: turtleneck.id, description: turtleneck.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(1);
  });

  it('garde un pull col rond porté seul (règle explicitement non demandée)', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Col rond seul', description: '',
      vetements: [{ id: crewNeckPull.id, description: crewNeckPull.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(1);
  });

  it('écarte un pull col V sans rien dessous', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Col V seul', description: '',
      vetements: [{ id: colVPull.id, description: colVPull.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(0);
  });

  it('écarte un pull col V porté sur un t-shirt (le t-shirt ne compte pas, il faut une chemise)', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Col V + t-shirt', description: '',
      vetements: [{ id: colVPull.id, description: colVPull.analysis }, { id: tshirt.id, description: tshirt.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(0);
  });

  it('garde un pull col V porté sur une chemise', () => {
    const outfit: OutfitSuggestion = {
      titre: 'Col V + chemise', description: '',
      vetements: [{ id: colVPull.id, description: colVPull.analysis }, { id: shirt.id, description: shirt.analysis }, { id: jean.id, description: jean.analysis }, { id: sneakers.id, description: sneakers.analysis }],
    };
    const result = filterOutfitsByHardConstraints([outfit], allItems, [], { temperatureCelsius: 10 });
    expect(result).toHaveLength(1);
  });
});
