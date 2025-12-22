import type { Category } from '../types';

// Définition des sous-catégories par catégorie
export const SUBCATEGORIES = {
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
} as const;

// Mots-clés pour détecter les sous-catégories
const KEYWORDS = {
  // Hauts
  'T-shirts': ['t-shirt', 'tee-shirt', 'tshirt', 'débardeur', 'tank top', 'maillot'],
  'Chemises': ['chemise', 'shirt', 'blouse', 'tunique'],
  'Pulls': ['pull', 'sweater', 'sweat', 'hoodie', 'gilet', 'cardigan', 'tricot'],
  'Vestes': ['veste', 'blouson', 'manteau', 'parka', 'doudoune', 'blazer', 'jacket', 'coat', 'trench'],

  // Bas
  'Pantalons': ['pantalon', 'jean', 'chino', 'trouser', 'cargo'],
  'Shorts': ['short', 'bermuda'],
  'Shorts sportifs': ['short sport', 'short jogging', 'short running', 'short gym'],

  // Chaussures
  'Sneakers': ['sneaker', 'basket', 'tennis', 'running', 'sport'],
  'Classiques': ['derby', 'richelieu', 'mocassin', 'loafer', 'oxford', 'chaussure de ville', 'escarpin', 'talon'],
  'Bottines': ['bottine', 'boot', 'chelsea', 'timberland', 'ranger'],

  // Accessoires (déjà existant)
  'Ceintures': ['ceinture', 'belt'],
  'Chapeaux': ['chapeau', 'casquette', 'bonnet', 'bob', 'béret', 'cap', 'hat'],
  'Écharpes & Foulards': ['écharpe', 'foulard', 'scarf', 'cheche'],
  'Lunettes': ['lunettes', 'glasses'],
  'Montres & Bijoux': ['montre', 'bracelet', 'collier', 'bague', 'boucle', 'watch', 'jewelry'],
  'Sacs': ['sac', 'bag', 'besace', 'cartable', 'pochette']
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
  return items.map(item => {
    // Si l'item a déjà une subcategory, on la garde
    if (item.subcategory) return item;

    // Sinon, on essaie de la détecter
    const detected = detectSubcategory(item.analysis, item.category);

    return detected ? { ...item, subcategory: detected } : item;
  });
}
