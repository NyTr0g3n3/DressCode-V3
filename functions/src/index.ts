import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Plus besoin de defineString("HUGGINGFACE_API_KEY") pour cette solution

export const generateImageWithHuggingFace = onCall(
  { 
    cors: true,
    timeoutSeconds: 60, // Pollinations est rapide, 60s suffisent
    memory: "512MiB",   // Moins de mémoire requise car on ne fait que du fetch
  },
  async (request) => {
    logger.info("Génération d'image via Pollinations.ai...");

    try {
      const { prompt } = request.data;

      if (!prompt) {
        throw new HttpsError('invalid-argument', 'Le prompt est requis');
      }

      // Nettoyage du prompt pour l'URL (enlever les caractères spéciaux)
      const safePrompt = encodeURIComponent(prompt.substring(0, 1000));
      
      // Construction de l'URL Pollinations
      // On ajoute 'nologo' pour éviter le watermark si possible et des paramètres de seed aléatoire
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=512&height=768&seed=${seed}&nologo=true&model=flux`; 
      // Note: 'model=flux' donne souvent de meilleurs résultats pour les vêtements que SD v1.5

      const response = await fetch(url);

      if (!response.ok) {
        throw new HttpsError('unavailable', `Erreur Pollinations (${response.status})`);
      }

      // Pollinations renvoie directement le binaire de l'image (buffer)
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      return { 
        imageUrl: `data:image/jpeg;base64,${base64Image}`
      };

    } catch (error) {
      logger.error("Erreur fatale:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Erreur interne: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
