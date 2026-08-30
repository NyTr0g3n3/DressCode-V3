import type { ClothingItem, ClothingSet, OutfitSuggestion } from '../types';

const SHORTS_MIN_TEMPERATURE_C = 22;

/**
 * Extrait la température en °C depuis la chaîne météo produite par
 * useWeather (toujours au format "18°C, ciel dégagé, à Paris"). Retourne
 * null si le format est inattendu ou si la météo n'est pas disponible —
 * dans ce cas les contraintes liées à la température sont simplement
 * ignorées (mieux vaut ne pas filtrer que filtrer sur une donnée absente).
 */
export function parseTemperatureCelsius(weatherInfo: string | null | undefined): number | null {
  if (!weatherInfo) return null;
  const match = weatherInfo.match(/^(-?\d+)\s*°C/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Résout les IDs d'une tenue (items individuels ET ensembles) vers la
 * liste complète des ClothingItem réellement portés — un ensemble compte
 * pour tous les items qu'il contient.
 */
function resolveOutfitItems(
  outfit: OutfitSuggestion,
  items: ClothingItem[],
  sets: ClothingSet[]
): ClothingItem[] {
  const itemById = new Map(items.map(item => [item.id, item]));
  const setById = new Map(sets.map(set => [set.id, set]));

  const resolved: ClothingItem[] = [];
  for (const vetement of outfit.vetements) {
    const item = itemById.get(vetement.id);
    if (item) {
      resolved.push(item);
      continue;
    }
    const set = setById.get(vetement.id);
    if (set) {
      set.itemIds.forEach(id => {
        const setItem = itemById.get(id);
        if (setItem) resolved.push(setItem);
      });
    }
  }
  return resolved;
}

/**
 * Une tenue complète a au moins un Haut, un Bas et une paire de
 * Chaussures (les Accessoires sont optionnels).
 */
function isStructurallyComplete(resolvedItems: ClothingItem[]): boolean {
  const categories = new Set(resolvedItems.map(item => item.category));
  return categories.has('Hauts') && categories.has('Bas') && categories.has('Chaussures');
}

/**
 * Un short (catégorie Bas, sous-catégorie Shorts/Shorts sportifs) alors
 * qu'il fait moins de 22°C — règle thermique non négociable.
 */
function hasInappropriateShorts(resolvedItems: ClothingItem[], temperatureCelsius: number | null): boolean {
  if (temperatureCelsius === null || temperatureCelsius >= SHORTS_MIN_TEMPERATURE_C) return false;
  return resolvedItems.some(
    item => item.category === 'Bas' && (item.subcategory === 'Shorts' || item.subcategory === 'Shorts sportifs')
  );
}

function includesAnchor(outfit: OutfitSuggestion, anchorId?: string): boolean {
  if (!anchorId) return true;
  return outfit.vetements.some(v => v.id === anchorId);
}

export interface HardConstraintsContext {
  temperatureCelsius?: number | null;
  anchorId?: string;
}

/**
 * Filtre les tenues générées par Gemini pour ne garder que celles qui
 * respectent les contraintes "dures" (factuelles, non négociables) :
 * structure complète, cohérence thermique, présence de l'article ancré.
 * Les règles de goût (couleurs, harmonie...) restent du ressort de l'IA —
 * volontairement PAS vérifiées ici, voir sharedStyleRules.ts.
 *
 * Une tenue qui échoue est écartée plutôt que "réparée" : mieux vaut
 * montrer moins de tenues, toutes correctes, qu'inclure une tenue connue
 * pour être fautive.
 */
export function filterOutfitsByHardConstraints(
  outfits: OutfitSuggestion[],
  items: ClothingItem[],
  sets: ClothingSet[],
  context: HardConstraintsContext = {}
): OutfitSuggestion[] {
  const temperatureCelsius = context.temperatureCelsius ?? null;

  return outfits.filter(outfit => {
    const resolvedItems = resolveOutfitItems(outfit, items, sets);

    if (!includesAnchor(outfit, context.anchorId)) {
      console.warn(`⚠️ Tenue "${outfit.titre}" écartée : n'inclut pas l'article ancré.`);
      return false;
    }
    if (!isStructurallyComplete(resolvedItems)) {
      console.warn(`⚠️ Tenue "${outfit.titre}" écartée : structure incomplète (haut/bas/chaussures manquant).`);
      return false;
    }
    if (hasInappropriateShorts(resolvedItems, temperatureCelsius)) {
      console.warn(`⚠️ Tenue "${outfit.titre}" écartée : short proposé alors qu'il fait ${temperatureCelsius}°C (< ${SHORTS_MIN_TEMPERATURE_C}°C).`);
      return false;
    }
    return true;
  });
}
