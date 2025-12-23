import type { Category } from '../types';

// Définition des sous-catégories par catégorie
export const SUBCATEGORIES: Record<Category, string[]> = {
  Hauts: ['T-shirts', 'Chemises', 'Pulls', 'Vestes'],
  Bas: ['Pantalons', 'Shorts', 'Shorts sportifs'],
  Chaussures: ['Sneakers', 'Classiques', 'Bottines'],
  Accessoires: [
    'Ceintures',
    'Chapeaux',
    'Écharpes & Foulards',
    'Lunettes',
    'Montres & Bijoux',
    'Sacs'
  ]
};

// Mots-clés pour détecter les sous-catégories
const KEYWORDS = {
  // Hauts
  'T-shirts': ['t-shirt', 'tee-shirt', 'tshirt', 'débardeur', 'tank top', 'maillot', 'polo', 'top'],
  'Chemises': ['chemise', 'shirt', 'blouse', 'tunique', 'chemisier'],
  'Pulls': ['pull', 'sweater', 'sweat', 'hoodie', 'gilet', 'cardigan', 'tricot', 'col roulé', 'col v'],
  'Vestes': ['veste', 'blouson', 'manteau', 'parka', 'doudoune', 'blazer', 'jacket', 'coat', 'trench', 'bomber', 'perfecto', 'teddy'],

  // Bas
  'Pantalons': ['pantalon', 'jean', 'chino', 'trouser', 'cargo', 'jogging', 'survêtement', 'slim', 'regular', 'straight'],
  'Shorts': ['short', 'bermuda'],
  'Shorts sportifs': ['short sport', 'short jogging', 'short running', 'short gym', 'short fitness'],

  // Chaussures
  'Sneakers': ['sneaker', 'basket', 'tennis', 'running', 'sport', 'air force', 'dunk', 'jordan', 'stan smith', 'adidas', 'nike'],
  'Classiques': ['derby', 'richelieu', 'mocassin', 'loafer', 'oxford', 'chaussure de ville', 'escarpin', 'talon', 'cuir ville'],
  'Bottines': ['bottine', 'boot', 'chelsea', 'timberland', 'ranger', 'boots'],

  // Accessoires (déjà existant)
  'Ceintures': ['ceinture', 'belt'],
  'Chapeaux': ['chapeau', 'casquette', 'bonnet', 'bob', 'béret', 'cap', 'hat'],
  'Écharpes & Foulards': ['écharpe', 'foulard', 'scarf', 'cheche', 'châle'],
  'Lunettes': ['lunettes', 'glasses', 'soleil'],
  'Montres & Bijoux': ['montre', 'bracelet', 'collier', 'bague', 'boucle', 'watch', 'jewelry', 'bijou'],
  'Sacs': ['sac', 'bag', 'besace', 'cartable', 'pochette', 'bandoulière']
};

/**
 * Détecte automatiquement la sous-catégorie d'un item en fonction de sa description
 */
export function detectSubcategory(analysis: string, category: Category): string | undefined {
  const lowerAnalysis = analysis.toLowerCase();
  const subcategoriesForCategory = SUBCATEGORIES[category];

  if (!subcategoriesForCategory) return undefined;

  // Parcourir les sous-catégories de cette catégorie
  for (const subcategory of subcategoriesForCategory) {
    const keywords = KEYWORDS[subcategory as keyof typeof KEYWORDS];

    if (!keywords) continue;

    // Vérifier si un mot-clé correspond
    for (const keyword of keywords) {
      if (lowerAnalysis.includes(keyword)) {
        return subcategory;
      }
    }
  }

  return undefined;
}

/**
 * Applique la classification automatique à tous les items qui n'ont pas encore de sous-catégorie
 */
export function classifyItems<T extends { analysis: string; category: Category; subcategory?: string }>(
  items: T[]
): T[] {
  let classified = 0;
  let alreadyClassified = 0;
  let unclassified = 0;

  const result = items.map(item => {
    // Si l'item a déjà une subcategory, on la garde
    if (item.subcategory) {
      alreadyClassified++;
      return item;
    }

    // Sinon, on essaie de la détecter
    const detected = detectSubcategory(item.analysis, item.category);

    if (detected) {
      classified++;
      return { ...item, subcategory: detected };
    } else {
      unclassified++;
      return item;
    }
  });

  console.log(`📊 Classification: ${classified} nouveaux, ${alreadyClassified} existants, ${unclassified} non classifiés`);

  return result;
}
