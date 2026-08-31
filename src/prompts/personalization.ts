import type { ClothingItem, ClothingSet, FavoriteOutfit, DislikedOutfit } from '../types';
import { computeStyleProfile } from '../utils/styleProfile';

// Nombre max de favoris/tenues écartées injectés dans le prompt sous forme
// de liste brute, pour ne pas le faire exploser en taille si l'utilisateur
// en a accumulé beaucoup. Les tendances calculées (voir computeStyleProfile),
// elles, portent sur TOUTES les tenues, pas seulement ces dernières.
const MAX_FAVORITES_IN_PROMPT = 8;
const MAX_DISLIKES_IN_PROMPT = 8;

/**
 * Construit un bloc d'instruction résumant le style personnel de
 * l'utilisateur à partir de ses tenues favorites, pour que la génération
 * de tenues en tienne compte plutôt que de repartir de zéro à chaque fois.
 * Combine deux sources :
 * - des tendances CALCULÉES (couleurs/matières les plus fréquentes, sur
 *   l'ensemble des favoris) — fiables, cf. computeStyleProfile
 * - la liste brute des favoris récents, que le LLM peut lire pour capter
 *   des nuances (formalité, associations) que les stats ne capturent pas
 *
 * Retourne une chaîne vide si l'utilisateur n'a aucun favori (rien à
 * apprendre de son style pour l'instant).
 */
export function buildFavoritesInstruction(
  favoriteOutfits: FavoriteOutfit[] | undefined,
  items: ClothingItem[] = [],
  sets: ClothingSet[] = []
): string {
  if (!favoriteOutfits || favoriteOutfits.length === 0) return '';

  const sample = favoriteOutfits.slice(-MAX_FAVORITES_IN_PROMPT);
  const favoritesFormatted = sample
    .map(fav => `- "${fav.titre}" : ${fav.description}`)
    .join('\n');

  const profile = computeStyleProfile(favoriteOutfits, items, sets);
  const profileBlock = profile
    ? `
📊 **Tendances calculées sur l'ensemble de ses ${profile.outfitCount} favoris** (comptage réel, pas une estimation) :
${profile.topColors.length > 0 ? `- Couleurs qui reviennent le plus souvent : ${profile.topColors.map(c => `${c.value} (${c.count}x)`).join(', ')}` : ''}
${profile.topMaterials.length > 0 ? `- Matières qui reviennent le plus souvent : ${profile.topMaterials.map(m => `${m.value} (${m.count}x)`).join(', ')}` : ''}
`
    : '';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 STYLE PERSONNEL DE L'UTILISATEUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profileBlock}
📝 **Tenues que l'utilisateur a mises en favoris par le passé** (ce qu'il a explicitement aimé) :
${favoritesFormatted}

⚠️ **COMMENT UTILISER CETTE INFORMATION** :
- Les tendances calculées ci-dessus (si présentes) sont fiables : priorise-les sur tes propres déductions à partir des descriptions
- Déduis aussi ses préférences à partir des tenues listées : niveau de formalité habituel, associations qui reviennent
- Quand plusieurs choix sont possibles à qualité égale, privilégie celui qui est cohérent avec ce style
- Cette information sert à AFFINER le choix, jamais à l'emporter sur les règles de température, de cohérence vestimentaire, ou sur l'article ancré (PRIORITÉ 0) s'il y en a un
- Ne recopie pas ces tenues telles quelles : inspire-toi du style qu'elles révèlent pour composer de nouvelles tenues avec la garde-robe actuelle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Symétrique de buildFavoritesInstruction pour le signal négatif : les
 * tenues que l'utilisateur a explicitement écartées (voir DislikedOutfit).
 * Même structure (tendances calculées + liste brute), mais la consigne
 * reste volontairement une DÉPRIORISATION, pas une interdiction — une
 * couleur "à éviter" peut rester le seul choix cohérent dans une
 * garde-robe donnée, et l'IA ne doit pas préférer une tenue incohérente
 * juste pour fuir cette couleur.
 *
 * Retourne une chaîne vide si l'utilisateur n'a écarté aucune tenue.
 */
export function buildDislikesInstruction(
  dislikedOutfits: DislikedOutfit[] | undefined,
  items: ClothingItem[] = [],
  sets: ClothingSet[] = []
): string {
  if (!dislikedOutfits || dislikedOutfits.length === 0) return '';

  const sample = dislikedOutfits.slice(-MAX_DISLIKES_IN_PROMPT);
  const dislikesFormatted = sample
    .map(d => `- "${d.titre}" : ${d.description}`)
    .join('\n');

  const profile = computeStyleProfile(dislikedOutfits, items, sets);
  const profileBlock = profile
    ? `
📊 **Tendances calculées sur l'ensemble des ${profile.outfitCount} tenues qu'il a écartées** (comptage réel) :
${profile.topColors.length > 0 ? `- Couleurs qui reviennent le plus souvent dans ce qu'il n'aime pas : ${profile.topColors.map(c => `${c.value} (${c.count}x)`).join(', ')}` : ''}
${profile.topMaterials.length > 0 ? `- Matières qui reviennent le plus souvent dans ce qu'il n'aime pas : ${profile.topMaterials.map(m => `${m.value} (${m.count}x)`).join(', ')}` : ''}
`
    : '';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 STYLE À ÉVITER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profileBlock}
📝 **Tenues que l'utilisateur a explicitement écartées** (ce qu'il n'a pas aimé) :
${dislikesFormatted}

⚠️ **COMMENT UTILISER CETTE INFORMATION** :
- Évite de PRIORISER les couleurs/matières/associations listées ci-dessus quand d'autres choix équivalents existent dans la garde-robe
- Ce n'est PAS une interdiction absolue : si la garde-robe ne propose rien d'autre de cohérent, utilise-les quand même plutôt que de composer une tenue moins cohérente juste pour les éviter
- Cette information sert à AFFINER le choix, jamais à l'emporter sur les règles de température, de cohérence vestimentaire, ou sur l'article ancré (PRIORITÉ 0) s'il y en a un

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
