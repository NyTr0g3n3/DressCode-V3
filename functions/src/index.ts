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
    logger.info("Demarrage VTON...");

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) throw new HttpsError("failed-precondition", "API Key manquante.");

    const replicate = new Replicate({ auth: apiToken });

    try {
      const {garmentUrl, humanImageUrl, category, description} = request.data;

      if (!garmentUrl) throw new HttpsError("invalid-argument", "Image vêtement manquante.");

      // Image de secours stable (GitHub)
      const defaultModelUrl = "https://raw.githubusercontent.com/yisol/IDM-VTON/main/inference/images/model.jpg";
      const userImage = (humanImageUrl && humanImageUrl.startsWith("http")) ? humanImageUrl : defaultModelUrl;

      logger.info(`Vêtement: ${description}`);
      logger.info(`Humain: ${userImage}`);

      const output = await replicate.run(
        "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        {
          input: {
            garm_img: garmentUrl,
            human_img: userImage,
            garment_des: description || "clothes",
            category: category === "Hauts" ? "upper_body" : category === "Bas" ? "lower_body" : "dresses",
            crop: false,
            steps: 30,
            seed: 42
          },
        }
      );

      // Forcer la sortie en String unique
      const finalUrl = Array.isArray(output) ? output[0] : String(output);
      
      logger.info("Succès:", finalUrl);
      return { imageUrl: finalUrl };

    } catch (error) {
      const err = error as Error;
      logger.error("Erreur:", err);
      
      if (err.message.includes("payment")) {
         throw new HttpsError("resource-exhausted", "Paiement Replicate requis.");
      }
      throw new HttpsError("internal", `Erreur génération: ${err.message}`);
    }
  }
);
