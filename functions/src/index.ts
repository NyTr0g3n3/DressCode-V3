import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";

export const generateVisualOutfit = onCall(
  { 
    cors: true,
    timeoutSeconds: 120,
    memory: "1GiB",
    secrets: [], 
  },
  async (request) => {
    logger.info("🚀 Démarrage VTON avec Replicate...");

    // 1. Vérification de sécurité : Est-ce que la clé est là ?
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      logger.error("❌ CRITIQUE: La clé REPLICATE_API_TOKEN est introuvable.");
      throw new HttpsError('failed-precondition', "Configuration serveur invalide (API Key manquante).");
    }

    // 2. CORRECTION ICI : On initialise Replicate DANS la fonction
    // C'est le seul moyen pour qu'il lise correctement la variable d'environnement
    const replicate = new Replicate({
      auth: apiToken,
    });

    try {
      const { garmentUrl, humanImageUrl, category, description } = request.data;

      if (!garmentUrl) {
        throw new HttpsError('invalid-argument', "L'image du vêtement (garmentUrl) est manquante.");
      }

      // Image de mannequin par défaut fiable
      const defaultModelUrl = "https://replicate.delivery/pbxt/JJ8O8M5p644w2Z5p644w2Z/model.jpg"; 
      const userImage = humanImageUrl || defaultModelUrl;

      logger.info(`Traitement en cours pour : ${description || 'Vêtement'}`);

      const output = await replicate.run(
        "cuuupid/idm-vton:c871bb9b0466074280c2a9a7386749d8b80df77287a616f749d78283b770428f",
        {
          input: {
            garm_img: garmentUrl,
            human_img: userImage,
            garment_des: description || "clothing",
            category: category === "Hauts" ? "upper_body" : category === "Bas" ? "lower_body" : "dresses",
            steps: 30,
            seed: 42
          }
        }
      );

      logger.info("✅ Image générée avec succès :", output);

      return { 
        imageUrl: output 
      };

    } catch (error: any) {
      logger.error("❌ Erreur Replicate détaillée:", error);
      
      if (error.message && error.message.includes("401")) {
         throw new HttpsError('unauthenticated', "Erreur d'authentification Replicate (Clé invalide).");
      }

      throw new HttpsError('internal', `Erreur de génération: ${error.message || String(error)}`);
    }
  }
);
