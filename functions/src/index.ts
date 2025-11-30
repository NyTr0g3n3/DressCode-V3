import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";

export const generateVisualOutfit = onCall(
  {
    cors: true,
    timeoutSeconds: 300, 
    memory: "1GiB",
  },
  async (request) => {
    logger.info("Demarrage VTON avec le modèle officiel Cuuupid (Version 0513734a)...");

    const apiToken = process.env.REPLICATE_API_TOKEN;

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

      const defaultModelUrl = "https://replicate.delivery/pbxt/KgwTlhCMvDagRrcVzZJbuozNJ8esPqiNAIJS3eMgHrYuHmW4/KakaoTalk_Photo_2024-04-04-21-44-45.png";
      const userImage = (humanImageUrl as string) || defaultModelUrl;

      logger.info(`Traitement : ${description || "Vetement"} (${category})`);

      const output = await replicate.run(
        "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
        {
          input: {
            garm_img: garmentUrl,
            human_img: userImage,
            garment_des: description || "clothing",
            category:
              category === "Hauts" ? "upper_body" :
              category === "Bas" ? "lower_body" :
              "dresses",
            crop: false, // Mettre à true si l'image de la personne n'est pas recadrée
            seed: 42,
            steps: 30
          },
        }
      );

      logger.info("Image générée avec succès !");

      return {
        imageUrl: output,
      };

    } catch (error) {
      const err = error as Error;
      logger.error("Erreur Replicate détaillée:", err);

      if (err.message.includes("payment")) {
         throw new HttpsError("resource-exhausted", "Problème de paiement Replicate.");
      }

      throw new HttpsError(
        "internal",
        `Erreur de generation: ${err.message}`
      );
    }
  }
);
