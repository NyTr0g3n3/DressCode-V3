import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";
import {GoogleGenAI, Type} from "@google/genai";

// Variables d'environnement (à configurer via Firebase Console ou CLI)
// Plus besoin de Secret Manager - on utilise des variables d'environnement classiques

export const generateVisualOutfit = onCall(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  async (request) => {
    logger.info("Demarrage VTON...");

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) throw new HttpsError("failed-precondition", "API Key manquante.");

    const replicate = new Replicate({ auth: apiToken });

    try {
      const {garmentUrl, humanImageUrl, category, description} = request.data;

      if (!garmentUrl) throw new HttpsError("invalid-argument", "Image vêtement manquante.");

      // Image de secours stable (GitHub)
      const defaultModelUrl = "https://raw.githubusercontent.com/yisol/IDM-VTON/main/inference/images/model.jpg";
      const userImage = (humanImageUrl && humanImageUrl.startsWith("http")) ? humanImageUrl : defaultModelUrl;

      logger.info(`Vêtement: ${description}`);
      logger.info(`Humain: ${userImage}`);

      const output = await replicate.run(
        "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        {
          input: {
            garm_img: garmentUrl,
            human_img: userImage,
            garment_des: description || "clothes",
            category: category === "Hauts" ? "upper_body" : category === "Bas" ? "lower_body" : "dresses",
            crop: false,
            steps: 30,
            seed: 42
          },
        }
      );

      // Forcer la sortie en String unique
      const finalUrl = Array.isArray(output) ? output[0] : String(output);
      
      logger.info("Succès:", finalUrl);
      return { imageUrl: finalUrl };

    } catch (error) {
      const err = error as Error;
      logger.error("Erreur:", err);
      
      if (err.message.includes("payment")) {
         throw new HttpsError("resource-exhausted", "Paiement Replicate requis.");
      }
      throw new HttpsError("internal", `Erreur génération: ${err.message}`);
    }
  }
);

// ============================================
// GEMINI CLOUD FUNCTIONS (SÉCURISÉES)
// ============================================

// Helper function to extract text from Gemini response
function extractText(response: any): string {
  try {
    if (typeof response.text === "function") {
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
    logger.error("Erreur lors de l'extraction du texte Gemini:", error);
    return "{}";
  }
}

// Analyse des vêtements
export const analyzeClothingImages = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {
    logger.info("Analyse de vêtements via Gemini...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("failed-precondition", "Clé API Gemini manquante.");

    const ai = new GoogleGenAI({apiKey});
    const {base64Images} = request.data;

    if (!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) {
      throw new HttpsError("invalid-argument", "Images manquantes.");
    }

    try {
      const textPart = {
        text: `Analyse chacune des images de vêtements fournies. Pour chaque image, dans l'ordre, extrais les informations suivantes en français :
    1. Une description concise incluant son type (ex: T-shirt, jean), sa couleur principale, et son style.
    2. Sa catégorie : "Hauts", "Bas", "Chaussures", ou "Accessoires".
    3. Sa couleur principale (ex: "Bleu", "Noir"). Sois concis.
    4. Sa matière principale (ex: "Coton", "Cuir"). Sois concis.

    Retourne le résultat sous la forme d'un objet JSON unique contenant une clé "items", qui est un tableau d'objets.`,
      };

      const imageParts = base64Images.map((img: string) => ({
        inlineData: {
          data: img,
          mimeType: "image/jpeg",
        },
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {parts: [textPart, ...imageParts]},
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
                    analysis: {type: Type.STRING},
                    category: {
                      type: Type.STRING,
                      enum: ["Hauts", "Bas", "Chaussures", "Accessoires"],
                    },
                    color: {type: Type.STRING},
                    material: {type: Type.STRING},
                  },
                  required: ["analysis", "category", "color", "material"],
                },
              },
            },
            required: ["items"],
          },
        },
      });

      const rawText = extractText(response);
      const result = JSON.parse(rawText);

      logger.info("Analyse réussie");
      return {items: result.items || []};
    } catch (error) {
      logger.error("Erreur analyse Gemini:", error);
      throw new HttpsError("internal", "Erreur lors de l'analyse des vêtements.");
    }
  }
);

// Génération de tenues
export const generateOutfitsFunction = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {
    logger.info("Génération de tenues via Gemini...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("failed-precondition", "Clé API Gemini manquante.");

    const ai = new GoogleGenAI({apiKey});
    const {prompt} = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt manquant.");
    }

    try {
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
                    titre: {type: Type.STRING},
                    description: {type: Type.STRING},
                    vetements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: {type: Type.STRING},
                          description: {type: Type.STRING},
                        },
                        required: ["id", "description"],
                      },
                    },
                  },
                  required: ["titre", "description", "vetements"],
                },
              },
            },
            required: ["tenues"],
          },
        },
      });

      const rawText = extractText(response);
      const jsonResponse = JSON.parse(rawText);

      logger.info("Tenues générées");
      return {tenues: jsonResponse.tenues};
    } catch (error) {
      logger.error("Erreur génération tenues:", error);
      throw new HttpsError("internal", "Erreur lors de la génération des tenues.");
    }
  }
);

// Analyse de garde-robe
export const analyzeWardrobeGapsFunction = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {
    logger.info("Analyse de garde-robe via Gemini...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("failed-precondition", "Clé API Gemini manquante.");

    const ai = new GoogleGenAI({apiKey});
    const {prompt} = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt manquant.");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Résumé global de l'analyse en 2-3 phrases",
              },
              strengths: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
                description: "2-3 points forts de la garde-robe actuelle",
              },
              gaps: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
                description: "2-4 gaps/opportunités d'amélioration identifiés",
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description: "Catégorie du vêtement suggéré",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Description précise du vêtement suggéré (style, couleur, matière)",
                    },
                    reason: {
                      type: Type.STRING,
                      description: "Pourquoi cette pièce est stratégique (combien de tenues elle permet)",
                    },
                    priority: {
                      type: Type.STRING,
                      enum: ["high", "medium", "low"],
                      description: "Niveau de priorité basé sur l'impact",
                    },
                    estimatedPrice: {
                      type: Type.STRING,
                      description: "Fourchette de prix estimée (ex: '50-80€')",
                    },
                    searchQuery: {
                      type: Type.STRING,
                      description: "Mots-clés optimisés pour recherche en boutique en ligne",
                    },
                  },
                  required: ["category", "description", "reason", "priority", "estimatedPrice", "searchQuery"],
                },
                description: "4-6 suggestions d'achats priorisées",
              },
            },
            required: ["summary", "strengths", "gaps", "suggestions"],
          },
        },
      });

      const rawText = extractText(response);
      const analysis = JSON.parse(rawText);

      logger.info("Analyse garde-robe réussie");
      return analysis;
    } catch (error) {
      logger.error("Erreur analyse garde-robe:", error);
      throw new HttpsError("internal", "Erreur lors de l'analyse de la garde-robe.");
    }
  }
);

// Planificateur de valise
export const generateVacationPlanFunction = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {
    logger.info("Génération plan vacances via Gemini...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("failed-precondition", "Clé API Gemini manquante.");

    const ai = new GoogleGenAI({apiKey});
    const {prompt} = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt manquant.");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titre: {type: Type.STRING},
              resume: {type: Type.STRING},
              valise: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: {type: Type.STRING},
                    description: {type: Type.STRING},
                  },
                  required: ["id", "description"],
                },
              },
            },
            required: ["titre", "resume", "valise"],
          },
        },
      });

      const rawText = extractText(response);
      const plan = JSON.parse(rawText);

      logger.info("Plan vacances généré");
      return plan;
    } catch (error) {
      logger.error("Erreur génération plan vacances:", error);
      throw new HttpsError("internal", "Erreur lors de la génération du plan vacances.");
    }
  }
);

// Chatbot Assistant Styliste
export const generateChatResponseFunction = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {
    logger.info("Génération réponse chatbot via Gemini...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("failed-precondition", "Clé API Gemini manquante.");

    const ai = new GoogleGenAI({apiKey});
    const {prompt} = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt manquant.");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "Réponse du chatbot ou message de refus si question hors-sujet",
              },
              isRejected: {
                type: Type.BOOLEAN,
                description: "true si la question est hors-sujet mode/style, false sinon",
              },
            },
            required: ["message", "isRejected"],
          },
        },
      });

      const rawText = extractText(response);
      const chatResponse = JSON.parse(rawText);

      logger.info("Réponse chatbot générée");
      return chatResponse;
    } catch (error) {
      logger.error("Erreur génération réponse chatbot:", error);
      throw new HttpsError("internal", "Erreur lors de la génération de la réponse chatbot.");
    }
  }
);
