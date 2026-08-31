import type { ClothingItem, ClothingSet, OutfitItem } from '../types';
import { resolveOutfitItems } from './outfitConstraints';

// En dessous de ce nombre de tenues, une "tendance" calculée serait plus
// du bruit qu'un vrai signal (même philosophie que parseTemperatureCelsius :
// mieux vaut ne rien dire que dire une donnée non fiable).
const MIN_OUTFITS_FOR_PROFILE = 3;
const TOP_N = 3;

export interface StyleProfileEntry {
  value: string;
  count: number;
}

export interface StyleProfile {
  outfitCount: number;
  topColors: StyleProfileEntry[];
  topMaterials: StyleProfileEntry[];
}

function topEntries(values: string[], limit: number): StyleProfileEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

/**
 * Calcule un résumé statistique du style à partir de TOUTES les tenues
 * d'une liste (favorites OU disliked — n'importe quelle liste de tenues
 * ayant un champ `vetements`, pas seulement les plus récentes, contrairement
 * au bloc "liste brute" de personalization.ts, plafonné à 8 pour ne pas
 * faire exploser le prompt) — couleurs et matières qui reviennent le plus
 * souvent parmi les articles réellement portés dans ces tenues.
 *
 * Contrairement au bloc brut, qui laisse le LLM déduire ces tendances
 * lui-même en lisant des descriptions en texte libre, ces chiffres sont
 * calculés une fois en code à partir des attributs structurés
 * (ClothingItem.color / .material) — donc fiables et stables d'une
 * génération à l'autre, plutôt que ré-devinés (et potentiellement
 * différents) à chaque appel.
 *
 * Retourne null s'il n'y a pas assez de tenues, ou si aucun des articles
 * qu'elles contiennent n'a pu être résolu (ex: garde-robe/tenues désynchro).
 */
export function computeStyleProfile(
  outfits: { vetements: OutfitItem[] }[] | undefined,
  items: ClothingItem[],
  sets: ClothingSet[]
): StyleProfile | null {
  if (!outfits || outfits.length < MIN_OUTFITS_FOR_PROFILE) return null;

  const allResolvedItems = outfits.flatMap(outfit => resolveOutfitItems(outfit, items, sets));
  if (allResolvedItems.length === 0) return null;

  return {
    outfitCount: outfits.length,
    topColors: topEntries(allResolvedItems.map(item => item.color), TOP_N),
    topMaterials: topEntries(allResolvedItems.map(item => item.material), TOP_N),
  };
}
