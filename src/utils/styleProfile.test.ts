import { describe, it, expect } from 'vitest';
import { computeStyleProfile } from './styleProfile';
import type { ClothingItem, FavoriteOutfit, DislikedOutfit } from '../types';

const navyTshirt: ClothingItem = {
  id: 'top-1', imageSrc: '', analysis: 'T-shirt bleu marine', category: 'Hauts', color: 'Bleu marine', material: 'Coton',
};
const navySweater: ClothingItem = {
  id: 'top-2', imageSrc: '', analysis: 'Pull bleu marine', category: 'Hauts', color: 'Bleu marine', material: 'Laine',
};
const blackJean: ClothingItem = {
  id: 'bottom-1', imageSrc: '', analysis: 'Jean noir', category: 'Bas', color: 'Noir', material: 'Denim',
};
const whiteSneakers: ClothingItem = {
  id: 'shoes-1', imageSrc: '', analysis: 'Sneakers blanches', category: 'Chaussures', color: 'Blanc', material: 'Cuir',
};
const allItems = [navyTshirt, navySweater, blackJean, whiteSneakers];

const makeFavorite = (id: string, itemIds: string[]): FavoriteOutfit => ({
  id,
  titre: `Look ${id}`,
  description: '',
  vetements: itemIds.map(itemId => ({ id: itemId, description: '' })),
});

describe('computeStyleProfile', () => {
  it('retourne null en dessous du seuil minimum de favoris', () => {
    const favorites = [
      makeFavorite('1', [navyTshirt.id, blackJean.id]),
      makeFavorite('2', [navySweater.id, blackJean.id]),
    ];
    expect(computeStyleProfile(favorites, allItems, [])).toBeNull();
  });

  it('retourne null sans favoris', () => {
    expect(computeStyleProfile(undefined, allItems, [])).toBeNull();
    expect(computeStyleProfile([], allItems, [])).toBeNull();
  });

  it('calcule les couleurs et matières les plus fréquentes sur tous les favoris', () => {
    const favorites = [
      makeFavorite('1', [navyTshirt.id, blackJean.id, whiteSneakers.id]),
      makeFavorite('2', [navySweater.id, blackJean.id, whiteSneakers.id]),
      makeFavorite('3', [navyTshirt.id, blackJean.id]),
    ];
    const profile = computeStyleProfile(favorites, allItems, []);

    expect(profile).not.toBeNull();
    expect(profile!.outfitCount).toBe(3);
    // Bleu marine apparaît 3x (navyTshirt x2 + navySweater x1), Noir 3x, Blanc 2x
    expect(profile!.topColors[0]).toMatchObject({ value: 'Bleu marine', count: 3 });
    expect(profile!.topMaterials.map(m => m.value)).toContain('Coton');
  });

  it('retourne null si aucun article des favoris ne peut être résolu (garde-robe vide)', () => {
    const favorites = [
      makeFavorite('1', ['id-inconnu-1']),
      makeFavorite('2', ['id-inconnu-2']),
      makeFavorite('3', ['id-inconnu-3']),
    ];
    expect(computeStyleProfile(favorites, [], [])).toBeNull();
  });

  it('résout les ensembles (sets) comme le fait outfitConstraints', () => {
    const favorites = [
      makeFavorite('1', ['set-1']),
      makeFavorite('2', [navyTshirt.id]),
      makeFavorite('3', [navySweater.id]),
    ];
    const sets = [{ id: 'set-1', name: 'Ensemble', itemIds: [navyTshirt.id, blackJean.id], imageSrc: '' }];
    const profile = computeStyleProfile(favorites, allItems, sets);

    expect(profile).not.toBeNull();
    expect(profile!.topColors.map(c => c.value)).toContain('Noir');
  });

  it('fonctionne aussi sur des tenues disliked (même forme, généricité voulue)', () => {
    const makeDislike = (id: string, itemIds: string[]): DislikedOutfit => ({
      id,
      titre: `Look évité ${id}`,
      description: '',
      vetements: itemIds.map(itemId => ({ id: itemId, description: '' })),
    });
    const dislikes = [
      makeDislike('1', [navyTshirt.id, blackJean.id]),
      makeDislike('2', [navySweater.id, blackJean.id]),
      makeDislike('3', [navyTshirt.id, blackJean.id]),
    ];
    const profile = computeStyleProfile(dislikes, allItems, []);

    expect(profile).not.toBeNull();
    expect(profile!.outfitCount).toBe(3);
    expect(profile!.topColors[0]).toMatchObject({ value: 'Bleu marine', count: 3 });
  });
});
