import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";

const huggingfaceApiKey = defineString("HUGGINGFACE_API_KEY");

export const generateImageWithHuggingFace = onRequest(
  { 
    timeoutSeconds: 120,
    memory: "512MiB"
  },
  async (request, response) => {
    // Gérer CORS manuellement
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    // Répondre aux preflight requests
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    logger.info("Génération d'image avec Hugging Face...");

    try {
      const { prompt } = request.body;

      if (!prompt) {
        response.status(400).json({ error: "Le prompt est requis" });
        return;
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
        response.status(hfResponse.status).json({ 
          error: `Hugging Face API error: ${hfResponse.status}` 
        });
        return;
      }

      const imageBuffer = await hfResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      logger.info("Image générée avec succès");

      response.status(200).json({ 
        imageUrl: `data:image/png;base64,${base64Image}`
      });

    } catch (error) {
      logger.error("Erreur:", error);
      response.status(500).json({ error: String(error) });
    }
  }
);
