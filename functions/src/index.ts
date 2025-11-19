import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";

// Pas d'initialisation globale ici pour éviter le crash au démarrage.

export const generateVisualOutfit = onCall(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: "1GiB",
    secrets: [],
  },
  async (request) => {
    logger.info("Démarrage VTON avec Replicate...");

    const apiToken = process.env.REPLICATE_API_TOKEN;

    if (!apiToken) {
      logger.error("CRITIQUE: La clé REPLICATE_API_TOKEN est introuvable.");
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
          "L'image du vêtement est manquante."
        );
      }

      const defaultModelUrl =
        "https://replicate.delivery/pbxt/JJ8O8M5p644w2Z5p644w2Z/model.jpg";
      const userImage = (humanImageUrl as string) || defaultModelUrl;

      logger.info(`Traitement : ${description || "Vêtement"} (${category})`);

      const output = await replicate.run(
  "cuuupid/idm-vton",
  {
    input: {
      garm_img: garmentUrl,
      human_img: userImage,
      garment_des: description || "clothing",
      category:
        category === "Hauts" ?
          "upper_body" :
          category === "Bas" ?
          "lower_body" :
          "dresses",
    },
  }
);

      logger.info("Image générée :", output);

      return {
        imageUrl: output,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Erreur Replicate détaillée:", err);

      const errorMessage = err.message || String(error);

      if (errorMessage.includes("401")) {
        throw new HttpsError(
          "unauthenticated",
          "Erreur d'authentification Replicate (Clé invalide)."
        );
      }

      throw new HttpsError(
        "internal",
        `Erreur de génération: ${errorMessage}`
      );
    }
  }
);
