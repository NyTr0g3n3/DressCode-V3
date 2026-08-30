import { describe, it, expect } from 'vitest';
import { buildFavoritesInstruction } from './personalization';
import type { FavoriteOutfit } from '../types';

const makeFavorite = (i: number): FavoriteOutfit => ({
  id: `fav-${i}`,
  titre: `Look ${i}`,
  description: `Description ${i}`,
  vetements: [],
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
});
