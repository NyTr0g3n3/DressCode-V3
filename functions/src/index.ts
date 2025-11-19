import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Replicate from "replicate";

// La clé sera chargée automatiquement depuis le fichier .env généré par GitHub Actions
const replicate = new Replicate();

export const generateVisualOutfit = onCall(
  { 
    cors: true,
    timeoutSeconds: 120, // Le traitement d'image peut être long
    memory: "1GiB",
  },
  async (request) => {
    logger.info("🚀 Démarrage VTON avec Replicate...");

    try {
      // On récupère les URLs des images envoyées par le frontend
      const { garmentUrl, humanImageUrl, category, description } = request.data;

      if (!garmentUrl) {
        throw new HttpsError('invalid-argument', "L'image du vêtement (garmentUrl) est manquante.");
      }

      // Image de mannequin par défaut si l'utilisateur n'a pas mis sa photo
      // (C'est une image libre de droit hébergée, ou vous pouvez mettre la vôtre)
      const defaultModelUrl = "https://replicate.delivery/pbxt/JJ8O8M5p644w2Z5p644w2Z/model.jpg"; 

      logger.info(`Traitement : ${description || 'Vêtement sans description'} (${category})`);

      const output = await replicate.run(
        "cuuupid/idm-vton:c871bb9b0466074280c2a9a7386749d8b80df77287a616f749d78283b770428f",
        {
          input: {
            garm_img: garmentUrl,
            human_img: humanImageUrl || defaultModelUrl,
            garment_des: description || "clothing",
            category: category === "Hauts" ? "upper_body" : category === "Bas" ? "lower_body" : "dresses",
            steps: 30,
            seed: 42
          }
        }
      );

      logger.info("✅ Image générée :", output);

      return { 
        imageUrl: output 
      };

    } catch (error) {
      logger.error("❌ Erreur Replicate:", error);
      // On renvoie une erreur propre au frontend
      throw new HttpsError('internal', `Erreur de génération: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
