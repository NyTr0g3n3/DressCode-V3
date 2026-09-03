
export type Category = 'Hauts' | 'Bas' | 'Chaussures' | 'Accessoires';

// Onglets de la navigation mobile (garde-robe par catégorie + accueil)
export type MobileTab = 'home' | 'hauts' | 'bas' | 'chaussures' | 'accessoires';

export interface ClothingItem {
  id: string;
  imageSrc: string;
  analysis: string;
  category: Category;
  subcategory?: string; // Sous-catégorie pour les accessoires (Montres & Bijoux, Écharpes & Foulards, Ceintures, Lunettes, Chapeaux, Sacs)
  color: string;
  material: string;
  isFavorite?: boolean;
  isExcluded?: boolean; // Exclure cet article des suggestions de tenues/valises
  // Bac à linge : timestamp de mise au sale, ou absent si l'article est
  // propre. Un timestamp plutôt qu'un simple booléen pour pouvoir afficher
  // "au bac depuis X jours" sans champ supplémentaire. Volontairement
  // distinct de isExcluded (exclusion permanente et délibérée) : celui-ci
  // est temporaire et se lève d'un geste une fois l'article lavé.
  dirtySince?: number;
  createdAt?: number; // Timestamp de création
}

export interface ClothingSet {
  id: string;
  name: string;
  itemIds: string[];
  imageSrc: string; // Utilise l'image du premier article de l'ensemble
}

export interface FavoriteOutfit {
  id: string; // ID du document Firestore
  titre: string;
  description: string;
  vetements: OutfitItem[];
}

export interface OutfitItem {
  id: string; // L'ID de l'article (item) ou de l'ensemble (set)
  description: string; // La description (ex: "T-shirt bleu")
}

export interface OutfitSuggestion {
  titre: string;
  description: string;
  vetements: OutfitItem[];
}

export interface VacationPlan {
  titre: string;
  resume: string;
  valise: OutfitItem[];
}

export interface WardrobeSuggestion {
  category: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedPrice?: string;
  searchQuery: string; // Query optimisée pour recherche en ligne
}

export interface WardrobeAnalysis {
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: WardrobeSuggestion[];
}

export interface OutfitWearHistory {
  id: string; // ID du document Firestore
  outfitTitle: string;
  outfitDescription: string;
  itemIds: string[]; // Liste des IDs des articles portés dans cette tenue
  wornAt: number; // Timestamp du port (date de sélection)
}

// Remplacement suggéré par le chat pour une pièce précise de la tenue en
// cours de discussion — porté par le message ET la réponse brute, pour
// que le bouton "Appliquer" reste rattaché au bon message une fois
// affiché dans l'historique (voir OutfitChatModal.tsx).
export interface ChatSuggestedReplacement {
  itemId: string;
  itemDescription: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestedReplacement?: ChatSuggestedReplacement | null;
}

export interface ChatResponse {
  message: string;
  isRejected: boolean; // true si la question est hors-sujet
  suggestedReplacement?: ChatSuggestedReplacement | null;
}

