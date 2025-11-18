import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";

const huggingfaceApiKey = defineString("HUGGINGFACE_API_KEY");

export const generateImageWithHuggingFace = onCall(
  { 
    cors: true,
    // AUGMENTATION DU TIMEOUT : On passe à 300 secondes (5 minutes) max
    timeoutSeconds: 300, 
    // AUGMENTATION DE LA MÉMOIRE : Pour éviter les crashs mémoire
    memory: "1GiB",
    // Optimisation pour limiter le nombre d'instances simultanées si besoin (optionnel)
    // maxInstances: 10,
  },
  async (request) => {
    logger.info("Génération d'image avec Hugging Face...");

    try {
      const { prompt } = request.data;

      if (!prompt) {
        throw new Error("Le prompt est requis");
      }

      // Log de la clé (partiel) pour débogage sécurisé
      const apiKey = huggingfaceApiKey.value();
      if (!apiKey) {
          logger.error("Clé API Hugging Face non trouvée !");
          throw new Error("Configuration serveur invalide : clé API manquante.");
      }
      logger.info(`Clé API détectée (longueur: ${apiKey.length})`);

      logger.info("Prompt:", prompt);

      // Appel à l'API Hugging Face (Modèle Stable Diffusion v1-5 pour la stabilité)
      const response = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          headers: { 
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "x-use-cache": "false"
          },
          method: "POST",
          body: JSON.stringify({ 
            inputs: prompt,
            options: { 
                wait_for_model: true, // Demande à HF d'attendre que le modèle charge
                use_cache: false
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Erreur Hugging Face:", errorText);
        
        // Gestion spécifique de l'erreur de chargement du modèle
        if (errorText.includes("estimated_time")) {
            throw new Error("Le modèle est en cours de chargement (Cold Start). Veuillez réessayer dans 30 secondes.");
        }
        
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      logger.info("Image générée avec succès");

      return { 
        imageUrl: `data:image/png;base64,${base64Image}`
      };

    } catch (error) {
      logger.error("Erreur fatale dans la fonction:", error);
      // On renvoie l'erreur au client pour qu'elle s'affiche dans l'alerte
      throw new Error(`Erreur génération: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
