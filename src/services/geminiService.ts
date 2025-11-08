import { GoogleGenAI, Type } from "@google/genai";
import type { ClothingItem, OutfitSuggestion, Category, ClothingSet, VacationPlan, WardrobeAnalysis } from '../types';

import { config } from '../config.ts';

if (!config.geminiApiKey) {
  throw new Error("Clé API manquante. Veuillez la configurer dans vos variables d'environnement.");
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

type AnalysisResult = Omit<ClothingItem, 'id' | 'imageSrc'>;

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
    model: 'gemini-flash-latest',
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
                            analysis: {
                                type: Type.STRING,
                                description: "La description concise du vêtement."
                            },
                            category: {
                                type: Type.STRING,
                                description: 'La catégorie du vêtement parmi "Hauts", "Bas", "Chaussures", ou "Accessoires".',
                                enum: ["Hauts", "Bas", "Chaussures", "Accessoires"]
                            },
                            color: {
                                type: Type.STRING,
                                description: "La couleur principale du vêtement."
                            },
                            material: {
                                type: Type.STRING,
                                description: "La matière principale du vêtement."
                            }
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
      const result = JSON.parse(response.text);
      const validCategories: Category[] = ["Hauts", "Bas", "Chaussures", "Accessoires"];
      
      (result.items as AnalysisResult[]).forEach(item => {
          if (!validCategories.includes(item.category)) {
              console.warn(`Catégorie invalide reçue de l'IA: ${item.category}, fallback sur "Accessoires"`);
              item.category = "Accessoires";
          }
      });
      
      return result.items as AnalysisResult[];
  } catch (e) {
      console.error("Erreur de parsing de la réponse de l'IA pour l'analyse par lot:", e);
      console.error("Réponse reçue:", response.text);
      throw new Error("L'IA a renvoyé une réponse d'analyse malformée.");
  }
}

function isClothingSet(item: any): item is ClothingSet {
    return item && item.name && Array.isArray(item.itemIds);
}

export async function generateOutfits(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    context: string,
    anchorItemOrSet?: ClothingItem | ClothingSet
): Promise<OutfitSuggestion[]> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id));

    const individualItemsFormatted = individualItems.map(item => `- ${item.analysis} (Catégorie: ${item.category}, Couleur: ${item.color}, Matière: ${item.material})`).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble)`).join('\n');

    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const anchorInstruction = anchorItemOrSet
        ? `\n**RÈGLE CRITIQUE : Chaque tenue DOIT impérativement inclure l'article ou l'ensemble suivant : "${isClothingSet(anchorItemOrSet) ? anchorItemOrSet.name : anchorItemOrSet.analysis}". C'est la pièce maîtresse.**\n`
        : '';

    const prompt = `
    Tu es un styliste de mode expert. Ta mission est de créer des tenues pour un utilisateur en fonction de sa garde-robe et d'un contexte précis.

    Contexte de l'utilisateur : "${context}"
    
    RÈGLE IMPORTANTE : Les articles marqués comme "(Ensemble)" sont des groupes de vêtements inséparables. Si tu utilises un ensemble, tu dois le lister par son nom (ex: "Costume bleu marine") et ne pas lister ses composants individuels.

    Vêtements et Ensembles disponibles :
    ${availableClothes}
    ${anchorInstruction}
    En te basant **uniquement** sur les vêtements et ensembles listés ci-dessus, crée 3 tenues distinctes et cohérentes qui correspondent au contexte de l'utilisateur.

    Pour chaque tenue, fournis :
    1. Un nom de titre court et accrocheur pour la tenue.
    2. Une brève description de l'ambiance ou du style de la tenue.
    3. La liste exacte des descriptions des vêtements ou des noms d'ensembles de la liste fournie à utiliser.

    Réponds en français.
  `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tenues: {
                        type: Type.ARRAY,
                        description: "La liste des suggestions de tenues.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                titre: { type: Type.STRING, description: "Le nom de la tenue." },
                                description: { type: Type.STRING, description: "Une brève description du style de la tenue." },
                                vetements: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING, description: "Description d'un vêtement ou nom d'un ensemble de la liste fournie." },
                                    description: "La liste des descriptions des vêtements ou ensembles composant la tenue.",
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
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.tenues as OutfitSuggestion[];
    } catch (e) {
        console.error("Erreur de parsing JSON de la réponse Gemini:", e);
        console.error("Réponse reçue:", response.text);
        throw new Error("L'IA a renvoyé une réponse malformée.");
    }
}

export async function analyzeWardrobeGaps(
  clothingItems: ClothingItem[],
  clothingSets: ClothingSet[]
): Promise<WardrobeAnalysis> {
  const itemsDescription = clothingItems.map(item => 
    `${item.category}: ${item.analysis}, couleur ${item.color}, matière ${item.material}`
  ).join('\n');

  const prompt = `Tu es un expert en mode et stylisme. Analyse cette garde-robe et suggère des pièces stratégiques à acheter pour la rendre plus versatile et polyvalente.

GARDE-ROBE ACTUELLE (${clothingItems.length} pièces):
${itemsDescription}

Analyse la garde-robe et identifie:
1. Les points forts de cette garde-robe
2. Les manques ou gaps à combler
3. Les pièces à acheter pour maximiser la polyvalence

Suggère 3-5 pièces maximum en priorisant les basiques polyvalents.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "Résumé général de la garde-robe (2-3 phrases)"
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Liste des points forts"
          },
          gaps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Liste des manques"
          },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                reason: { type: Type.STRING },
                priority: {
                  type: Type.STRING,
                  enum: ["high", "medium", "low"]
                },
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

  try {
    const analysis: WardrobeAnalysis = JSON.parse(response.text);
    return analysis;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}
export async function generateVacationPlan(
    clothingList: ClothingItem[],
    sets: ClothingSet[],
    days: number,
    context: string,
): Promise<VacationPlan> {
    const itemIdsInSets = new Set(sets.flatMap(s => s.itemIds));
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id));

    const individualItemsFormatted = individualItems.map(item => `- ${item.analysis} (Catégorie: ${item.category}, Couleur: ${item.color}, Matière: ${item.material})`).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble)`).join('\n');

    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const prompt = `
    Tu es un styliste de voyage et un expert en organisation. Ta mission est de créer une valise optimisée pour un voyage.

    Détails du voyage :
    - Durée : ${days} jour(s)
    - Contexte / Météo : "${context}"

    Vêtements et Ensembles disponibles dans la garde-robe :
    ${availableClothes}
    
    RÈGLES :
    1. Crée une liste de vêtements à emporter qui soit polyvalente et minimale.
    2. Ne sélectionne QUE des articles de la liste fournie.
    3. Les articles marqués comme "(Ensemble)" sont inséparables.
    4. Assure-toi que la quantité de vêtements est appropriée pour ${days} jour(s).
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    titre: { type: Type.STRING, description: "Le nom du plan de valise." },
                    resume: { type: Type.STRING, description: "Un bref résumé de la stratégie de la valise." },
                    valise: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "La liste des vêtements à emporter.",
                    }
                },
                required: ["titre", "resume", "valise"],
            }
        }
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as VacationPlan;
    } catch (e) {
        console.error("Erreur de parsing JSON:", e);
        throw new Error("L'IA a renvoyé une réponse malformée.");
    }
}
