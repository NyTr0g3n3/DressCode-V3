import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";

// ⬇️ IMPORTANT : Définir le secret
const replicateToken = defineSecret("REPLICATE_API_TOKEN");

export const generateVisualOutfit = onCall(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: "1GiB",
    secrets: [replicateToken], // ⬅️ Déclarer le secret ici
  },
  async (request) => {
    logger.info("Demarrage VTON avec Replicate...");

    const apiToken = replicateToken.value(); // ⬅️ Lire la valeur du secret

    if (!apiToken) {
      logger.error("CRITIQUE: La cle REPLICATE_API_TOKEN est introuvable.");
      throw new HttpsError(
        "failed-precondition",
        "Configuration serveur invalide (API Key manquante)."
      );
    }

    const replicate = new Replicate({
      auth: apiToken,
    });

    try {
      const {garmentUrl, humanImageUrl, category, description} = request.data;

      if (!garmentUrl) {
        throw new HttpsError(
          "invalid-argument",
          "L'image du vetement est manquante."
        );
      }

      const defaultModelUrl =
        "https://replicate.delivery/pbxt/JJ8O8M5p644w2Z5p644w2Z/model.jpg";
      const userImage = (humanImageUrl as string) || defaultModelUrl;

      logger.info(`Traitement : ${description || "Vetement"} (${category})`);

      const output = await replicate.run(
        "cuuupid/idm-vton",
        {
          input: {
            garm_img: garmentUrl,
            human_img: userImage,
            category:
              category === "Hauts" ?
                "upper_body" :
                category === "Bas" ?
                "lower_body" :
                "dresses",
          },
        }
      );

      logger.info("Image generee avec succes");

      return {
        imageUrl: output,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Erreur Replicate detaillee:", err);

      throw new HttpsError(
        "internal",
        `Erreur de generation: ${err.message}`
      );
    }
  }
);
