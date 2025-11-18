import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";

const huggingfaceApiKey = defineString("HUGGINGFACE_API_KEY");

export const generateImageWithHuggingFace = onCall(
  { 
    cors: true,
    // C'EST ICI QUE TOUT SE JOUE :
    timeoutSeconds: 300, // Doit être à 300 (pas 120)
    memory: "1GiB",      // Doit être à 1GiB (pas 512MiB)
  },
  async (request) => {
    logger.info("Génération d'image avec Hugging Face...");

    try {
      const { prompt } = request.data;

      if (!prompt) {
        throw new HttpsError('invalid-argument', 'Le prompt est requis');
      }

      const apiKey = huggingfaceApiKey.value();
      if (!apiKey) {
          logger.error("ERREUR : Clé API manquante");
          throw new HttpsError('failed-precondition', 'Clé API manquante sur le serveur.');
      }

      // Utilisation du modèle Stable Diffusion v1-5 (plus stable pour les cold starts)
      const response = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          headers: { 
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "x-use-cache": "false"
          },
          method: "POST",
          body: JSON.stringify({ 
            inputs: prompt,
            options: { 
                wait_for_model: true,
                use_cache: false
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Erreur Hugging Face:", errorText);
        
        if (errorText.includes("estimated_time")) {
             throw new HttpsError('resource-exhausted', 'Le modèle démarre (Cold Start). Réessayez dans 30 secondes.');
        }
        throw new HttpsError('unavailable', `Erreur API HF: ${response.status} - ${errorText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      return { 
        imageUrl: `data:image/png;base64,${base64Image}`
      };

    } catch (error) {
      logger.error("Erreur fatale:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Erreur interne: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
