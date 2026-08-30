import { describe, it, expect } from 'vitest';
import { validateAndFixOutfitIds, validateAndFixVacationPlanIds } from './outfitValidation';
import type { ClothingItem, ClothingSet, OutfitSuggestion, VacationPlan } from '../types';

const tshirt: ClothingItem = {
  id: 'item-1', imageSrc: '', analysis: 'T-shirt blanc uni', category: 'Hauts', color: 'Blanc', material: 'Coton',
};
const jean: ClothingItem = {
  id: 'item-2', imageSrc: '', analysis: 'Jean brut', category: 'Bas', color: 'Bleu', material: 'Denim',
};
const set: ClothingSet = {
  id: 'set-1', name: 'Ensemble sport', itemIds: ['item-1', 'item-2'], imageSrc: '',
};

describe('validateAndFixOutfitIds', () => {
  it('garde un ID déjà valide tel quel', () => {
    const outfits: OutfitSuggestion[] = [{
      titre: 'Look casual', description: '', vetements: [{ id: 'item-1', description: 'T-shirt blanc uni' }],
    }];
    const result = validateAndFixOutfitIds(outfits, [tshirt, jean], []);
    expect(result[0].vetements[0].id).toBe('item-1');
  });

  it('corrige un ID invalide par correspondance exacte de description', () => {
    const outfits: OutfitSuggestion[] = [{
      titre: 'Look casual', description: '', vetements: [{ id: 'id-invente-par-gemini', description: 'T-shirt blanc uni' }],
    }];
    const result = validateAndFixOutfitIds(outfits, [tshirt, jean], []);
    expect(result[0].vetements[0].id).toBe('item-1');
  });

  it('corrige un ID invalide par correspondance partielle de description', () => {
    const outfits: OutfitSuggestion[] = [{
      titre: 'Look casual', description: '', vetements: [{ id: 'oops', description: 'T-shirt blanc' }],
    }];
    const result = validateAndFixOutfitIds(outfits, [tshirt, jean], []);
    expect(result[0].vetements[0].id).toBe('item-1');
  });

  it("conserve l'ID invalide tel quel si aucune correspondance n'est trouvée", () => {
    const outfits: OutfitSuggestion[] = [{
      titre: 'Look casual', description: '', vetements: [{ id: 'inconnu', description: 'Pull licorne rose fluo' }],
    }];
    const result = validateAndFixOutfitIds(outfits, [tshirt, jean], []);
    expect(result[0].vetements[0].id).toBe('inconnu');
  });

  it('reconnaît les IDs des ensembles au même titre que les items individuels', () => {
    const outfits: OutfitSuggestion[] = [{
      titre: 'Look sport', description: '', vetements: [{ id: 'set-1', description: 'Ensemble sport' }],
    }];
    const result = validateAndFixOutfitIds(outfits, [tshirt, jean], [set]);
    expect(result[0].vetements[0].id).toBe('set-1');
  });

  it("respecte les espaces superflus autour d'un ID valide", () => {
    const outfits: OutfitSuggestion[] = [{
      titre: 'Look casual', description: '', vetements: [{ id: '  item-1  ', description: 'T-shirt blanc uni' }],
    }];
    const result = validateAndFixOutfitIds(outfits, [tshirt, jean], []);
    expect(result[0].vetements[0].id).toBe('item-1');
  });
});

describe('validateAndFixVacationPlanIds', () => {
  const basePlan = (valise: VacationPlan['valise']): VacationPlan => ({
    titre: 'Valise soleil', resume: '', valise,
  });

  it('remplace un item individuel appartenant à un set par le set complet', () => {
    const plan = basePlan([{ id: 'item-1', description: 'T-shirt blanc uni' }]);
    const result = validateAndFixVacationPlanIds(plan, [tshirt, jean], [set]);
    expect(result.valise).toEqual([{ id: 'set-1', description: 'Ensemble sport' }]);
  });

  it("n'ajoute pas deux fois le même ensemble si ses deux items sont proposés séparément", () => {
    const plan = basePlan([
      { id: 'item-1', description: 'T-shirt blanc uni' },
      { id: 'item-2', description: 'Jean brut' },
    ]);
    const result = validateAndFixVacationPlanIds(plan, [tshirt, jean], [set]);
    expect(result.valise).toEqual([{ id: 'set-1', description: 'Ensemble sport' }]);
  });

  it('garde un ID de set déjà correct tel quel', () => {
    const plan = basePlan([{ id: 'set-1', description: 'Ensemble sport' }]);
    const result = validateAndFixVacationPlanIds(plan, [tshirt, jean], [set]);
    expect(result.valise).toEqual([{ id: 'set-1', description: 'Ensemble sport' }]);
  });

  it('corrige un ID invalide par correspondance de description', () => {
    const plan = basePlan([{ id: 'invalide', description: 'Jean brut' }]);
    const result = validateAndFixVacationPlanIds(plan, [tshirt, jean], []);
    expect(result.valise).toEqual([{ id: 'item-2', description: 'Jean brut' }]);
  });
});
