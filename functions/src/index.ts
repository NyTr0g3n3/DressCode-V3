import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";

export const generateVisualOutfit = onCall(
  { 
    cors: true, // Gère le CORS automatiquement si la fonction ne plante pas
    timeoutSeconds: 120,
    memory: "1GiB",
    // On s'assure que les secrets/envs sont chargés
    secrets: [], 
  },
  async (request) => {
    logger.info("🚀 Démarrage VTON avec Replicate...");

    // 1. Vérification de la clé API
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      logger.error("❌ CRITIQUE: La clé REPLICATE_API_TOKEN est introuvable dans process.env");
      throw new HttpsError('failed-precondition', "Configuration serveur invalide (API Key manquante).");
    } else {
      logger.info(`✅ Clé API détectée (commence par : ${apiToken.substring(0, 4)}...)`);
    }

    // 2. Initialisation de Replicate À L'INTÉRIEUR de la fonction
    const replicate = new Replicate({
      auth: apiToken,
    });

    try {
      const { garmentUrl, humanImageUrl, category, description } = request.data;

      if (!garmentUrl) {
        throw new HttpsError('invalid-argument', "L'image du vêtement (garmentUrl) est manquante.");
      }

      // URL d'un mannequin par défaut (image hébergée fiable)
      const defaultModelUrl = "https://replicate.delivery/pbxt/JJ8O8M5p644w2Z5p644w2Z/model.jpg"; 
      const userImage = humanImageUrl || defaultModelUrl;

      logger.info(`👗 Vêtement: ${garmentUrl}`);
      logger.info(`👤 Modèle: ${userImage}`);
      logger.info(`📝 Description: ${description || 'N/A'}`);

      // 3. Appel à Replicate
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
      
      // Gestion spécifique des erreurs Replicate
      if (error.message && error.message.includes("401")) {
         throw new HttpsError('unauthenticated', "Erreur d'authentification Replicate (Clé invalide).");
      }

      throw new HttpsError('internal', `Erreur de génération: ${error.message || String(error)}`);
    }
  }
);
