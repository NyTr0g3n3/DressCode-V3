import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";

const huggingfaceApiKey = defineString("HUGGINGFACE_API_KEY");

export const generateImageWithHuggingFace = onCall(
  { 
    cors: true,  // Important : active CORS automatiquement
    timeoutSeconds: 120,
    memory: "512MiB"
  },
  async (request) => {
    logger.info("Génération d'image avec Hugging Face...");

    try {
      const { prompt } = request.data;

      if (!prompt) {
        throw new Error("Le prompt est requis");
      }

      logger.info("Prompt:", prompt);

      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
        {
          headers: { 
            Authorization: `Bearer ${huggingfaceApiKey.value()}`,
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify({ 
            inputs: prompt,
            options: { wait_for_model: true }
          }),
        }
      );

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        logger.error("Erreur Hugging Face:", errorText);
        throw new Error(`Hugging Face API error: ${hfResponse.status}`);
      }

      const imageBuffer = await hfResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      logger.info("Image générée avec succès");

      return { 
        imageUrl: `data:image/png;base64,${base64Image}`
      };

    } catch (error) {
      logger.error("Erreur:", error);
      throw error;
    }
  }
);
