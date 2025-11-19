import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const generateImageWithHuggingFace = onCall(
  { 
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request) => {

    try {
      const { prompt } = request.data;
      const safePrompt = encodeURIComponent(prompt.substring(0, 1500)); // On augmente un peu la limite
      const seed = Math.floor(Math.random() * 1000000);
      
      const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=768&height=1024&seed=${seed}&nologo=true&model=flux&enhance=true`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new HttpsError('unavailable', `Erreur Pollinations (${response.status})`);
      }

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
