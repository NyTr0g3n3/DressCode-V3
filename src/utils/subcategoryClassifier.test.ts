import { describe, it, expect } from 'vitest';
import { detectSubcategory, classifyItems } from './subcategoryClassifier';
import type { ClothingItem } from '../types';

describe('detectSubcategory', () => {
  it('détecte un t-shirt dans les Hauts', () => {
    expect(detectSubcategory('T-shirt blanc uni en coton', 'Hauts')).toBe('T-shirts');
  });

  it('détecte une chemise dans les Hauts', () => {
    expect(detectSubcategory('Chemise oxford bleu clair', 'Hauts')).toBe('Chemises');
  });

  it('détecte un jean dans les Bas', () => {
    expect(detectSubcategory('Jean brut slim', 'Bas')).toBe('Pantalons');
  });

  it('priorise le mot-clé le plus spécifique ("short sport") sur le générique ("short")', () => {
    expect(detectSubcategory('Short sport noir', 'Bas')).toBe('Shorts sportifs');
  });

  it('détecte toujours un short générique (non sportif) comme "Shorts"', () => {
    expect(detectSubcategory('Bermuda beige en lin', 'Bas')).toBe('Shorts');
  });

  it('détecte une montre dans les Accessoires', () => {
    expect(detectSubcategory('Montre connectée Apple Watch', 'Accessoires')).toBe('Montres & Bijoux');
  });

  it("retourne undefined quand aucun mot-clé ne correspond", () => {
    expect(detectSubcategory('Robe longue fleurie', 'Hauts')).toBeUndefined();
  });

  it("n'est pas sensible à la casse", () => {
    expect(detectSubcategory('CHEMISE BLANCHE', 'Hauts')).toBe('Chemises');
  });
});

describe('classifyItems', () => {
  it('assigne une sous-catégorie aux items qui en sont dépourvus', () => {
    const items: ClothingItem[] = [
      { id: '1', imageSrc: '', analysis: 'T-shirt blanc uni', category: 'Hauts', color: 'Blanc', material: 'Coton' },
    ];
    const result = classifyItems(items);
    expect(result[0].subcategory).toBe('T-shirts');
  });

  it('ne touche pas à la sous-catégorie déjà définie manuellement', () => {
    const items: ClothingItem[] = [
      { id: '1', imageSrc: '', analysis: 'T-shirt blanc uni', category: 'Hauts', subcategory: 'Custom', color: 'Blanc', material: 'Coton' },
    ];
    const result = classifyItems(items);
    expect(result[0].subcategory).toBe('Custom');
  });

  it('laisse la sous-catégorie undefined si rien ne correspond', () => {
    const items: ClothingItem[] = [
      { id: '1', imageSrc: '', analysis: 'Robe longue fleurie', category: 'Hauts', color: 'Rouge', material: 'Soie' },
    ];
    const result = classifyItems(items);
    expect(result[0].subcategory).toBeUndefined();
  });

  it("ne mute pas le tableau d'entrée", () => {
    const items: ClothingItem[] = [
      { id: '1', imageSrc: '', analysis: 'T-shirt blanc uni', category: 'Hauts', color: 'Blanc', material: 'Coton' },
    ];
    classifyItems(items);
    expect(items[0].subcategory).toBeUndefined();
  });
});
