import { describe, it, expect } from 'vitest';
import { buildFavoritesInstruction } from './personalization';
import type { ClothingItem, FavoriteOutfit } from '../types';

const makeFavorite = (i: number): FavoriteOutfit => ({
  id: `fav-${i}`,
  titre: `Look ${i}`,
  description: `Description ${i}`,
  vetements: [],
});

const navyTshirt: ClothingItem = {
  id: 'top-1', imageSrc: '', analysis: 'T-shirt bleu marine', category: 'Hauts', color: 'Bleu marine', material: 'Coton',
};
const navySweater: ClothingItem = {
  id: 'top-2', imageSrc: '', analysis: 'Pull bleu marine', category: 'Hauts', color: 'Bleu marine', material: 'Laine',
};
const blackJean: ClothingItem = {
  id: 'bottom-1', imageSrc: '', analysis: 'Jean noir', category: 'Bas', color: 'Noir', material: 'Denim',
};
const wardrobeItems = [navyTshirt, navySweater, blackJean];

const makeFavoriteWithItems = (i: number, itemIds: string[]): FavoriteOutfit => ({
  id: `fav-${i}`,
  titre: `Look ${i}`,
  description: `Description ${i}`,
  vetements: itemIds.map(id => ({ id, description: '' })),
});

describe('buildFavoritesInstruction', () => {
  it('retourne une chaîne vide sans favoris', () => {
    expect(buildFavoritesInstruction(undefined)).toBe('');
    expect(buildFavoritesInstruction([])).toBe('');
  });

  it('inclut le titre et la description de chaque favori', () => {
    const result = buildFavoritesInstruction([makeFavorite(1), makeFavorite(2)]);
    expect(result).toContain('Look 1');
    expect(result).toContain('Description 1');
    expect(result).toContain('Look 2');
    expect(result).toContain('Description 2');
  });

  it('plafonne à 8 favoris pour ne pas faire exploser le prompt', () => {
    const favorites = Array.from({ length: 12 }, (_, i) => makeFavorite(i + 1));
    const result = buildFavoritesInstruction(favorites);

    // Garde les 8 DERNIERS (les plus susceptibles d'être pertinents/récents)
    expect(result).not.toContain('Look 1"');
    expect(result).not.toContain('Look 4"');
    expect(result).toContain('Look 5');
    expect(result).toContain('Look 12');
  });

  it("précise que l'info ne doit jamais l'emporter sur les règles strictes", () => {
    const result = buildFavoritesInstruction([makeFavorite(1)]);
    expect(result.toLowerCase()).toContain('jamais');
  });

  it("n'inclut pas de tendances calculées sans garde-robe fournie (rétrocompatibilité)", () => {
    const result = buildFavoritesInstruction([makeFavorite(1), makeFavorite(2), makeFavorite(3)]);
    expect(result).not.toContain('Tendances calculées');
  });

  it('inclut les tendances calculées quand assez de favoris ont des articles résolvables', () => {
    const favorites = [
      makeFavoriteWithItems(1, [navyTshirt.id, blackJean.id]),
      makeFavoriteWithItems(2, [navySweater.id, blackJean.id]),
      makeFavoriteWithItems(3, [navyTshirt.id, blackJean.id]),
    ];
    const result = buildFavoritesInstruction(favorites, wardrobeItems, []);

    expect(result).toContain('Tendances calculées');
    expect(result).toContain('Bleu marine');
    expect(result).toContain('Noir');
  });
});
