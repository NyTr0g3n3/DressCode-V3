import { GoogleGenAI, Type } from "@google/genai";
import type { ClothingItem, OutfitSuggestion, Category, ClothingSet, VacationPlan, WardrobeAnalysis } from '../types';
import { config } from '../config.ts';     
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

if (!config.geminiApiKey) {
  throw new Error("Clé API manquante. Veuillez la configurer dans vos variables d'environnement.");
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

type AnalysisResult = Omit<ClothingItem, 'id' | 'imageSrc'>;

function extractText(response: any): string {
  try {
    if (typeof response.text === 'function') {
      return response.text();
    }
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
    
    Retourne le résultat sous la forme d'un objet JSON unique contenant une clé "items", qui est un tableau d'objets.`,
  };

  const imageParts = base64Images.map(img => ({
    inlineData: {
      data: img,
      mimeType: 'image/jpeg',
    },
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, ...imageParts] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                items: {
                    type: Type.ARRAY,
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
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Matière: ${item.material})`
    ).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const anchorInstruction = anchorItemOrSet
        ? `\n**RÈGLE D'ANCRAGE : La tenue DOIT inclure : "${('name' in anchorItemOrSet ? anchorItemOrSet.name : anchorItemOrSet.analysis)} (ID: ${anchorItemOrSet.id})".**\n`
        : '';
 
    const prompt = `Tu es un styliste expert reconnu pour ton goût impeccable. Crée 3 tenues complètes et harmonieuses basées sur le contexte : "${context}".
    
Vêtements disponibles :
${availableClothes}
${anchorInstruction}

**RÈGLES CRITIQUES** :

1. **BASE** : Utilise UNIQUEMENT les articles listés. Chaque tenue doit être complète (Haut + Bas + Chaussures).

2. **ACCESSOIRES** : Chaque tenue DOIT être accompagnée d'une montre (si disponible).

3. **SUPERPOSITION (LAYERING)** :
   - **Pull col V** → OBLIGATOIREMENT avec une chemise en dessous
   - **Pull col camionneur/zippé** → OBLIGATOIREMENT avec un t-shirt ou chemise en dessous
   - **Veste/Blazer** → Peut aller sur t-shirt, chemise, ou pull fin

4. **LOGIQUE THERMIQUE (CRITIQUE)** :
   - Analyse la météo mentionnée dans le contexte.
   
   | Température | Règle |
   |-------------|-------|
   | **< 10°C (FROID)** | Layering OBLIGATOIRE : T-shirt + Pull + Manteau. JAMAIS une chemise seule sous un manteau. |
   | **10-20°C (DOUX)** | Pull, sweat ou veste légère suffisent. |
   | **> 20°C (CHAUD)** | Une seule couche légère (t-shirt OU chemise). JAMAIS de pull ni veste. |
   | **> 30°C (TRÈS CHAUD)** | Vêtements très légers uniquement. INTERDITS : jeans épais, matières synthétiques. |

5. **INTERDICTIONS THERMIQUES ABSOLUES** :
   - ❌ Doudoune/veste d'hiver si > 15°C
   - ❌ Short si < 12°C
   - ❌ Sandales si < 15°C
   - ❌ Pull en laine si > 22°C

6. **MATIÈRES ADAPTÉES** :
   - **Chaud (> 25°C)** : Privilégier coton léger, lin, matières respirantes
   - **Froid (< 10°C)** : Privilégier laine, polaire, matières chaudes
   
7. **HARMONIE DES COULEURS & MOTIFS** :
   - **Règle des 3 couleurs** : Maximum 3 couleurs différentes par tenue
   - **Équilibre motifs** : Si le haut est à motifs → bas UNI. Jamais 2 motifs différents ensemble.
   - **Contraste** : Éviter les tons trop proches (bleu marine + noir) sauf choix délibéré

8. **VARIÉTÉ** : Les 3 tenues doivent être VISUELLEMENT différentes. Évite de répéter le même pantalon 3 fois.

**SORTIE** : Renvoie l'ID EXACT et la description pour chaque article sélectionné.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
    model: "gemini-2.5-flash",
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
    maxWeight?: number 
): Promise<VacationPlan> {
    const itemIdsInSets = new Set((sets || []).flatMap(s => s.itemIds));
    const individualItems = clothingList.filter(item => !itemIdsInSets.has(item.id));

    const individualItemsFormatted = individualItems.map(item => 
      `- ${item.analysis} (ID: ${item.id}, Cat: ${item.category}, Couleur: ${item.color}, Matière: ${item.material})`
    ).join('\n');
    const setsFormatted = sets.map(set => `- ${set.name} (Ensemble, ID: ${set.id})`).join('\n');
    const availableClothes = [individualItemsFormatted, setsFormatted].filter(Boolean).join('\n');

    const weightInstruction = maxWeight 
        ? `\n**CONTRAINTE POIDS** : Le poids total NE DOIT PAS dépasser ${maxWeight} kg. Estime le poids moyen (t-shirt ~150g, jean ~600g, pull ~400g, chaussures ~800g).` 
        : '';

    const prompt = `Tu es un expert en préparation de valise. Crée une **CAPSULE WARDROBE** optimisée pour ${days} jours.

**DESTINATION & CONTEXTE** : ${context}

**PRINCIPE CAPSULE WARDROBE** : Sélectionner peu de pièces qui se combinent TOUTES entre elles pour créer un maximum de tenues différentes.

**RÈGLES CRITIQUES** :

1. **LOGIQUE THERMIQUE (PRIORITÉ ABSOLUE)** :
   
   | Température | Vêtements adaptés |
   |-------------|-------------------|
   | **> 30°C (TRÈS CHAUD)** | T-shirts légers, shorts, robes, sandales. INTERDITS : jeans, pulls, vestes |
   | **25-30°C (CHAUD)** | T-shirts, pantalons légers, une chemise, baskets légères |
   | **15-25°C (DOUX)** | Mix léger + 1 pull fin ou veste légère |
   | **10-15°C (FRAIS)** | Pulls, pantalons, veste, chaussures fermées |
   | **< 10°C (FROID)** | Layering complet : sous-couche + pull + manteau chaud |

2. **INTERDICTIONS ABSOLUES** :
   - ❌ Doudoune/veste ski/polaire épaisse si > 20°C
   - ❌ Shorts si < 15°C
   - ❌ Sandales si < 18°C
   - ❌ Pulls en laine si > 25°C
   - ❌ Jeans épais si > 32°C

3. **MATIÈRES ADAPTÉES** :
   - **Climat chaud** : Coton léger, lin, matières respirantes uniquement
   - **Climat froid** : Laine, polaire, matières isolantes
   - **Voyage** : Privilégier matières qui ne se froissent pas

4. **HARMONIE CAPSULE (pour que tout se combine)** :
   - **Palette de couleurs** : Maximum 4-5 couleurs qui vont ensemble (ex: bleu marine, blanc, beige, une couleur d'accent)
   - **Motifs** : Maximum 2 pièces à motifs dans toute la valise, le reste UNI
   - **Neutralité** : Au moins 50% de pièces en couleurs neutres (noir, blanc, gris, beige, marine)

5. **QUANTITÉS RECOMMANDÉES pour ${days} jours** :
   - Hauts : ${Math.min(days + 1, 7)} pièces max (on peut reporter un t-shirt)
   - Bas : ${Math.min(Math.ceil(days / 2) + 1, 4)} pièces max
   - Chaussures : 2-3 paires max
   - Accessoires : selon besoin

6. **LAYERING INTELLIGENT (si climat variable)** :
   - Prévoir des couches qui s'empilent : t-shirt → chemise/pull léger → veste
   - Chaque couche doit être portable seule ET en combinaison

${weightInstruction}

**VÊTEMENTS DISPONIBLES** :
${availableClothes}

**SORTIE** : 
- Un titre accrocheur pour cette valise
- Un résumé expliquant tes choix (météo, style, combinaisons possibles)
- La liste des articles avec leur ID exact`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

// --- GÉNÉRATION VISUELLE (VIRTUAL TRY-ON VIA REPLICATE) ---
const generateVisualFunction = httpsCallable(functions, 'generateVisualOutfit');

export async function generateVisualOutfit(
    items: ClothingItem[],
    context: string,
): Promise<string> {
    
    console.log("🚀 Préparation du Virtual Try-On...");

    const mainItem = items[0];

    if (!mainItem || !mainItem.imageSrc) {
        throw new Error("Aucun vêtement valide trouvé pour l'essayage.");
    }

    try {
        const result = await generateVisualFunction({ 
            garmentUrl: mainItem.imageSrc, 
            category: mainItem.category,   
            description: mainItem.analysis
        });
        
        const data = result.data as { imageUrl: string };
        
        if (!data || !data.imageUrl) {
            throw new Error("Pas d'image retournée par le serveur.");
        }

        console.log("✅ Image reçue de Replicate !");
        return data.imageUrl;
        
    } catch (error) {
        console.error("❌ Erreur lors de l'appel Cloud Function :", error);
        throw error;
    }
}
