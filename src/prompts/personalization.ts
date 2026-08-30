import type { FavoriteOutfit } from '../types';

// Nombre max de favoris injectés dans le prompt, pour ne pas le faire
// exploser en taille si l'utilisateur en a accumulé beaucoup.
const MAX_FAVORITES_IN_PROMPT = 8;

/**
 * Construit un bloc d'instruction résumant le style personnel de
 * l'utilisateur à partir de ses tenues favorites, pour que la génération
 * de tenues en tienne compte plutôt que de repartir de zéro à chaque fois.
 * Retourne une chaîne vide si l'utilisateur n'a aucun favori (rien à
 * apprendre de son style pour l'instant).
 */
export function buildFavoritesInstruction(favoriteOutfits?: FavoriteOutfit[]): string {
  if (!favoriteOutfits || favoriteOutfits.length === 0) return '';

  const sample = favoriteOutfits.slice(-MAX_FAVORITES_IN_PROMPT);
  const favoritesFormatted = sample
    .map(fav => `- "${fav.titre}" : ${fav.description}`)
    .join('\n');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 STYLE PERSONNEL DE L'UTILISATEUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **Tenues que l'utilisateur a mises en favoris par le passé** (ce qu'il a explicitement aimé) :
${favoritesFormatted}

⚠️ **COMMENT UTILISER CETTE INFORMATION** :
- Déduis-en ses préférences personnelles : couleurs qu'il aime porter, niveau de formalité habituel, associations qui reviennent
- Quand plusieurs choix sont possibles à qualité égale, privilégie celui qui est cohérent avec ce style
- Cette information sert à AFFINER le choix, jamais à l'emporter sur les règles de température, de cohérence vestimentaire, ou sur l'article ancré (PRIORITÉ 0) s'il y en a un
- Ne recopie pas ces tenues telles quelles : inspire-toi du style qu'elles révèlent pour composer de nouvelles tenues avec la garde-robe actuelle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
