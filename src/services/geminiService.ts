import { GoogleGenAI, Type } from "@google/genai";
import type { ClothingItem, OutfitSuggestion, Category, ClothingSet, VacationPlan, WardrobeAnalysis } from '../types';
import { config } from '../config.ts';     
// 1. Import des fonctions Firebase
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

if (!config.geminiApiKey) {
  throw new Error("Clé API manquante. Veuillez la configurer dans vos variables d'environnement.");
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

type AnalysisResult = Omit<ClothingItem, 'id' | 'imageSrc'>;

/**
 * Fonction utilitaire pour extraire le texte de la réponse Gemini de manière sécurisée.
 * Gère le cas où la méthode .text() n'existe pas.
 */
function extractText(response: any): string {
  try {
    // 1. Essayer la méthode officielle si elle existe
    if (typeof response.text === 'function') {
      return response.text();
    }
    // 2. Fallback : Accès direct à la structure de données (candidates)
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || "{}";
      }
    }
    return "{}";
  } catch (error) {
    console.error("Erreur lors de l'extraction du texte Gemini:", error);
    return "{}";
  }
}

// --- ANALYSE DES VÊTEMENTS ---
export async function analyzeClothingImages(base64Images: string[]): Promise<AnalysisResult[]> {
  const textPart = {
    text: `Analyse chacune des images de vêtements fournies. Pour chaque image, dans l'ordre, extrais les informations suivantes en français :
    1. Une description concise incluant son type (ex: T-shirt, jean), sa couleur principale, et son style.
    2. Sa catégorie : "Hauts", "Bas", "Chaussures", ou "Accessoires".
    3. Sa couleur principale (ex: "Bleu", "Noir"). Sois concis.
    4. Sa matière principale (ex: "Coton", "Cuir"). Sois concis.
    
    Retourne le résultat sous la forme d'un objet JSON unique contenant une clé "items", qui est un tableau d'objets. Chaque objet du tableau doit correspondre à une image et contenir les champs : "analysis", "category", "color", et "material".`,
  };

  const imageParts = base64Images.map(img => ({
    inlineData: {
      data: img,
      mimeType: 'image/jpeg',
    },
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // MISE À JOUR : Gemini 2.5 Flash
    contents: { parts: [textPart, ...imageParts] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                items: {
                    type: Type.ARRAY,
                    description: "Un tableau d'analyses pour chaque vêtement.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            analysis: { type: Type.STRING },
                            category: {
                                type: Type.STRING,
                                enum: ["Hauts", "Bas", "Chaussures", "Accessoires"]
                            },
                            color: { type: Type.STRING },
                            material: { type: Type.STRING }
                        },
                        required: ["analysis", "category", "color", "material"]
                    }
                }
            },
            required: ["items"]
        }
    }
  });

  try {
      const rawText = extractText(response);
      const result = JSON.parse(rawText);
      
      const validCategories: Category[] = ["Hauts", "Bas", "Chaussures", "Accessoires"];
      
      if (result.items) {
          (result.items as AnalysisResult[]).forEach(item => {
              if (!validCategories.includes(item.category)) {
                  item.category = "Accessoires";
              }
          });
          return result.items as AnalysisResult[];
      }
      return [];
  } catch (e) {
      console.error("Erreur parsing Gemini:", e);
      throw new Error("L'IA a renvoyé une réponse malformée.");
  }
}

// --- GÉNÉRATION DE TENUES ---
export async function generateOutfits(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    context: string,
    anchorItemOrSet?: ClothingItem | ClothingSet
): Promise<OutfitSuggestion[]> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id));

    const individualItemsFormatted = individualItems.map(item => 
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category})`
    ).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const anchorInstruction = anchorItemOrSet
        ? `\n**RÈGLE D'ANCRAGE : La tenue DOIT inclure : "${'name' in anchorItemOrSet ? anchorItemOrSet.name : anchorItemOrSet.analysis} (ID: ${anchorItemOrSet.id})".**\n`
        : '';
 
    const prompt = `
    Tu es un styliste expert. Crée 3 tenues complètes et harmonieuses basées sur le contexte : "${context}".
    
    Vêtements disponibles :
    ${availableClothes}
    ${anchorInstruction}

    Règles :
    1. Utilise UNIQUEMENT les articles listés.
    2. Chaque tenue doit être complète (Haut + Bas + Chaussures si dispo).
    3. IMPORTANT : Renvoie l'ID EXACT et la description EXACTE pour chaque article.

    Réponds en JSON avec une liste "tenues".
  `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // MISE À JOUR : Gemini 2.5 Flash
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tenues: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                titre: { type: Type.STRING },
                                description: { type: Type.STRING },
                                vetements: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING },
                                            description: { type: Type.STRING }
                                        },
                                        required: ["id", "description"]
                                    }
                                }
                            },
                            required: ["titre", "description", "vetements"],
                        }
                    }
                },
                required: ["tenues"],
            }
        }
    });

    try {
        const rawText = extractText(response);
        const jsonResponse = JSON.parse(rawText);
        return jsonResponse.tenues as OutfitSuggestion[];
    } catch (e) {
        console.error("Erreur parsing Gemini:", e);
        throw new Error("Réponse malformée.");
    }
}

// --- ANALYSE DES MANQUES ---
export async function analyzeWardrobeGaps(
  clothingItems: ClothingItem[],
  clothingSets: ClothingSet[]
): Promise<WardrobeAnalysis> {
  const itemsDescription = clothingItems.map(item => `${item.category}: ${item.analysis}`).join('\n');

  const prompt = `Analyse cette garde-robe (${clothingItems.length} pièces) et suggère 3-5 achats stratégiques.
  
  Garde-robe :
  ${itemsDescription}
  
  Renvoie un résumé, les points forts, les manques, et des suggestions avec priorité et prix estimé.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // MISE À JOUR : Gemini 2.5 Flash
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                reason: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                estimatedPrice: { type: Type.STRING }
              },
              required: ["category", "description", "reason", "priority", "estimatedPrice"]
            }
          }
        },
        required: ["summary", "strengths", "gaps", "suggestions"]
      }
    }
  });

  const rawText = extractText(response);
  return JSON.parse(rawText);
}

// --- PLANIFICATEUR DE VALISE ---
export async function generateVacationPlan(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    days: number,
    context: string,
): Promise<VacationPlan> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id));

    const individualItemsFormatted = individualItems.map(item => `- ${item.analysis} (ID: ${item.id})`).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const prompt = `Crée une valise optimisée pour ${days} jours. Contexte : ${context}.
    Utilise ces vêtements :
    ${availableClothes}
    
    Renvoie un titre, un résumé et la liste des articles (id et description).`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // MISE À JOUR : Gemini 2.5 Flash
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    titre: { type: Type.STRING },
                    resume: { type: Type.STRING },
                    valise: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ["id", "description"]
                        }
                    }
                },
                required: ["titre", "resume", "valise"],
            }
        }
    });

    const rawText = extractText(response);
    return JSON.parse(rawText);
}

// --- GÉNÉRATION VISUELLE (VIA CLOUD FUNCTION) ---
// 2. On prépare l'appel à la fonction serveur pour éviter le CORS
const generateImageFunction = httpsCallable(functions, 'generateImageWithHuggingFace');

export async function generateVisualOutfit(
    items: ClothingItem[],
    context: string,
): Promise<string> {
    
    const itemsDescription = items.map(i => i.analysis).join(", ");
    const prompt = `Fashion photo of a person wearing: ${itemsDescription}. Context: ${context}. Photorealistic, 8k.`;
    
    // Ce log prouvera que le bon code est chargé
    console.log("🚀 Génération via Cloud Function (Relais Serveur)...");

    try {
        // 3. Appel au serveur (plus de fetch direct vers Hugging Face)
        const result = await generateImageFunction({ prompt });
        const data = result.data as { imageUrl: string };
        
        if (!data || !data.imageUrl) {
            throw new Error("Pas d'image retournée par le serveur.");
        }

        console.log("✅ Image reçue du serveur avec succès !");
        return data.imageUrl;
        
    } catch (error) {
        console.error("❌ Erreur lors de l'appel Cloud Function:", error);
        throw error;
    }
}
