import { GoogleGenAI, Type } from "@google/genai";
import type { ClothingItem, OutfitSuggestion, Category, ClothingSet, VacationPlan, WardrobeAnalysis } from '../types';
import { config } from '../config.ts';     

if (!config.geminiApiKey) {
  throw new Error("Clé API manquante. Veuillez la configurer dans vos variables d'environnement.");
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

type AnalysisResult = Omit<ClothingItem, 'id' | 'imageSrc'>;

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
    model: 'gemini-2.0-flash',
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
      const result = JSON.parse(response.text() || "{}");
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
        model: "gemini-2.0-flash",
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
        const jsonResponse = JSON.parse(response.text() || "{}");
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
    model: "gemini-2.0-flash",
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

  return JSON.parse(response.text() || "{}");
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
        model: "gemini-2.0-flash",
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

    return JSON.parse(response.text() || "{}");
}

// --- GÉNÉRATION VISUELLE (HUGGING FACE / SDXL) ---
export async function generateVisualOutfit(
    items: ClothingItem[],
    context: string,
): Promise<string> {
    
    if (!config.huggingFaceApiKey) {
        console.error("Clé API Hugging Face manquante.");
        throw new Error("Configuration requise : Clé API Hugging Face introuvable.");
    }

    const itemsDescription = items.map(i => i.analysis).join(", ");
    // Prompt optimisé pour le modèle SDXL
    const prompt = `Fashion photography, full body shot of a model wearing: ${itemsDescription}. 
    Context: ${context}. 
    High quality, photorealistic, 8k, studio lighting, fashion magazine style, neutral background.`;
    
    console.log("Génération visuelle via Hugging Face (SDXL)...");

    try {
        // Appel direct à l'API d'inférence Hugging Face
        const response = await fetch(
            "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
            {
                headers: {
                    Authorization: `Bearer ${config.huggingFaceApiKey}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: prompt,
                    options: { wait_for_model: true }
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erreur API Hugging Face:", errorText);
            throw new Error(`Erreur génération image (${response.status})`);
        }

        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        
    } catch (error) {
        console.error("Erreur lors de la génération visuelle:", error);
        throw error;
    }
}
