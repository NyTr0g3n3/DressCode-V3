
export type Category = 'Hauts' | 'Bas' | 'Chaussures' | 'Accessoires';

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  message: string;
  isRejected: boolean; // true si la question est hors-sujet
}

