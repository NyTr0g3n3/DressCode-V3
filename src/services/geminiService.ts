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


    const individualItemsFormatted = individualItems.map(item => 
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Couleur: ${item.color}, Mat: ${item.material})`
    ).join('\n');
    const setsFormatted = sets.map(set => 
      `- ${set.name} (Ensemble, ID: ${set.id})`
    ).join('\n');


    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const anchorInstruction = anchorItemOrSet
        ? `\n**RÈGLE D'ANCRAGE : Chaque tenue DOIT impérativement inclure l'article ou l'ensemble suivant : "${isClothingSet(anchorItemOrSet) ? anchorItemOrSet.name : anchorItemOrSet.analysis} (ID: ${anchorItemOrSet.id})". C'est la pièce maîtresse.**\n`
        : '';

 
    const prompt = `
    Tu es un styliste de mode expert. Ta mission est de créer des tenues pertinentes, complètes et harmonieuses.

    Contexte de l'utilisateur : "${context}"
    
    Vêtements et Ensembles disponibles (utilise leur ID, Cat, Couleur, Mat) :
    ${availableClothes}
    ${anchorInstruction}

    ---
    RÈGLES DE STYLE (CRITIQUES) :
    Ce sont des règles impératives.
    1. **Montre :** Chaque tenue DOIT inclure une montre (Cat: "Accessoires"). Choisis la plus adaptée au style de la tenue. Si aucune montre n'est disponible, n'en invente pas.
    2. **Météo (Veste) :** Le "Contexte" inclut la météo. Si la température est inférieure à 20°C, la tenue DOIT inclure une veste, un manteau, ou un gilet (Cat: "Hauts").
    3. **Pull Col V :** Si tu inclus un pull à col en "V" (Cat: "Hauts"), tu DOIS impérativement le superposer avec une chemise à col boutonné (Cat: "Hauts") en dessous.
    4. **Pull Col Zippé :** Si tu inclus un pull à col zippé (Cat: "Hauts"), tu DOIS impérativement le superposer avec une chemise ou un t-shirt (Cat: "Hauts") en dessous.

    ---
    RÈGLES DE STYLE (GÉNÉRALES) :
    1. **Cohérence :** Une tenue doit être complète et logique. Elle doit inclure au moins un "Hauts" et un "Bas". Si des "Chaussures" pertinentes existent, inclus-les.
    2. **Harmonie :** Assure-toi que les couleurs et les matières de la tenue sont bien assorties.
    3. **Variété :** Les 3 tenues proposées doivent être distinctes les unes des autres.

    ---
    RÈGLES DE FORMAT (OBLIGATOIRES) :
    1. Base-toi **uniquement** sur les vêtements et ensembles listés ci-dessus.
    2. Pour chaque article que tu sélectionnes, tu DOIS fournir son ID exact et sa description.
    3. Les articles marqués comme "(Ensemble)" sont inséparables.

    Crée 3 tenues distinctes. Pour chaque tenue, fournis :
    1. Un "titre" court et accrocheur.
    2. Une "description" brève du style et *pourquoi* elle est adaptée au contexte et respecte les règles.
    3. Une liste "vetements" d'objets, où chaque objet contient "id" et "description" de l'article ou de l'ensemble utilisé.

    Réponds en français.
  `;


    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
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
                                    description: "La liste des objets vêtements composant la tenue.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING, description: "L'ID de l'article ou de l'ensemble." },
                                            description: { type: Type.STRING, description: "La description de l'article." }
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
    model: "gemini-flash-latest",
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
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id));

    // ▼▼▼ MODIFICATION : On envoie plus de données (Catégorie, Couleur, Matière) ▼▼▼
    const individualItemsFormatted = individualItems.map(item => 
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Couleur: ${item.color}, Mat: ${item.material})`
    ).join('\n');
    const setsFormatted = sets.map(set => 
      `- ${set.name} (Ensemble, ID: ${set.id})`
    ).join('\n');
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲

    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const prompt = `
    Tu es un styliste de voyage. Ta mission est de créer une valise optimisée.

    Détails du voyage :
    - Durée : ${days} jour(s)
    - Contexte / Météo : "${context}"

    Vêtements et Ensembles disponibles (utilise leur ID, Cat, Couleur, Mat) :
    ${availableClothes}
    
    RÈGLES :
    1. Crée une liste "valise" polyvalente et minimale. Vise la "mix-and-match" (articles qui vont ensemble).
    2. Ne sélectionne QUE des articles de la liste fournie.
    3. Pour chaque article que tu sélectionnes, tu DOIS fournir son ID exact et sa description.
    4. Les articles marqués comme "(Ensemble)" sont inséparables.
    5. Prends en compte le Contexte/Météo pour la sélection.

    Réponds avec un "titre", un "resume" (explique la stratégie de la valise), et la liste "valise".
    La liste "valise" doit contenir des objets, où chaque objet contient "id" et "description".
    `;

    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
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
                        description: "La liste des objets vêtements à emporter.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING, description: "L'ID de l'article ou de l'ensemble." },
                                description: { type: Type.STRING, description: "La description de l'article." }
                            },
                            required: ["id", "description"]
                        }
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

// -------------------------------------------------
// FONCTION FACTICE POUR LE RENDU VISUEL
// (Ceci simule un appel à une API de génération d'images)
// -------------------------------------------------
export async function generateVisualOutfit(
    items: ClothingItem[],
    context: string,
): Promise<string> {
    
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    console.log("Appel factice de génération d'image avec :", {
        context: context,
        items: items.map(item => item.analysis)
    });

    // Simule le temps de génération de l'image (3 secondes)
    await wait(3000); 

    // TODO: Remplacer ceci par un véritable appel à l'API Google Imagen (Vertex AI)
    // Le vrai prompt ressemblerait à :
    // "Photo réaliste en pied d'un mannequin portant :
    // - Haut: [Utiliser l'image de items[0].imageSrc comme référence] ${items[0].analysis}
    // - Bas: [Utiliser l'image de items[1].imageSrc comme référence] ${items[1].analysis}
    // - ...etc
    // Style: ${context}"
    
    // On renvoie une image de substitution pour le test
    const placeholderImage = `https://picsum.photos/seed/${encodeURIComponent(context)}/512/768`;
    
    console.log("Rendu factice généré :", placeholderImage);
    
    return placeholderImage;
}
