
export type Category = 'Hauts' | 'Bas' | 'Chaussures' | 'Accessoires';

export interface ClothingItem {
  id: string;
  imageSrc: string; // Doit être une URL Firebase Storage (pas de base64)
  analysis: string; // AI-generated description
  category: Category;
  color: string; // e.g., "Bleu", "Noir", "Blanc"
  material: string; // e.g., "Coton", "Cuir", "Jean"
}

export interface ClothingSet {
  id: string;
  name: string;
  itemIds: string[];
  imageSrc: string; // Utilise l'image du premier article de l'ensemble
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
}

export interface WardrobeAnalysis {
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: WardrobeSuggestion[];
}

