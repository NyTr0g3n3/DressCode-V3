
export type Category = 'Hauts' | 'Bas' | 'Chaussures' | 'Accessoires';

export interface ClothingItem {
  id: string;
  imageSrc: string; // base64 data URL
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

export interface OutfitSuggestion {
  titre: string;
  description: string;
  vetements: string[];
}

export interface VacationPlan {
  titre: string;
  resume: string;
  valise: string[]; // Liste des descriptions des vêtements
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

