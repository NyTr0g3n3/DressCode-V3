import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { VertexAI } from "@google-cloud/vertexai";

// Initialiser Firebase Admin
initializeApp();

// --- CONFIGURATION VERTEX AI (IMAGEN) ---
// ▼▼▼ METTEZ VOTRE ID DE PROJET ICI ▼▼▼
const PROJECT_ID = process.env.GCLOUD_PROJECT || "dresscode-ai-32c50"; 
// ▲▲▲ METTEZ VOTRE ID DE PROJET ICI ▲▲▲

const FIREBASE_STORAGE_BUCKET = PROJECT_ID + ".appspot.com"; 
const LOCATION = "us-central1"; // Laissez "us-central1"

const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const generativeModel = vertexAI.getGenerativeModel({
  model: "imagen-3.0-fast-flash-001",
});
// ------------------------------------------


// Fonction qui convertit une URL d'image Firebase en base64
async function urlToGenerativePart(url: string, mimeType: string) {
  // Transformation de l'URL pour la rendre "fetchable" par le serveur
  const publicUrl = url.replace(
    `gs://${FIREBASE_STORAGE_BUCKET}/`,
    `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/`
  )
  // Assure que les tokens de média sont correctement formatés
  .replace("?alt=media&token=", "%3Falt%3Dmedia%26token%3D");
    
  logger.info("Fetching image from:", publicUrl);

  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText} from ${publicUrl}`);
  }
  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString("base64");

  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

export const generateVisualOutfitOnServer = onCall(
  { 
    cors: true, // Autorise votre app web à appeler cette fonction
    timeoutSeconds: 300, // Augmente le délai d'attente à 5 minutes
    memory: "1GiB" // Alloue plus de mémoire
  },
  async (request) => {
    logger.info("Début de la génération visuelle...", { structuredData: true });

    try {
      // 1. Récupérer les données envoyées par le client
      const items = request.data.items as any[];
      const context = request.data.context as string;

      if (!items || items.length === 0 || !context) {
        throw new Error("Données manquantes : items et context sont requis.");
      }

      // 2. Préparer les images pour le prompt multimodal
      const imageParts = await Promise.all(
        items.slice(0, 3).map((item) => 
          urlToGenerativePart(item.imageSrc, "image/jpeg")
        )
      );

      // 3. Construire le prompt
      const textPrompt = `
        Tu es un générateur de "virtual try-on".
        Ta mission est de générer une photo réaliste d'un mannequin (homme ou femme, peu importe) portant les vêtements fournis en référence.
        
        Contexte de la tenue: "${context}"
        
        Voici les vêtements à utiliser comme référence visuelle (dans l'ordre) :
        1. Vêtement 1 (probablement un haut)
        2. Vêtement 2 (probablement un bas)
        3. Vêtement 3 (probablement des chaussures)
        
        Crée une image en pied, style "street photography" ou e-commerce, où le mannequin porte des vêtements qui ressemblent le plus possible aux images de référence fournies. L'éclairage doit être naturel et cohérent.
        Le mannequin ne doit pas avoir de visage ou son visage doit être flouté.
      `;

      // 4. Appeler l'API Imagen (Vertex AI)
      const requestPrompt = {
        contents: [
          {
            role: "user",
            parts: [
              ...imageParts, // Les images en premier
              { text: textPrompt }, // Le texte ensuite
            ],
          },
        ],
      };

      logger.info("Envoi de la requête à Vertex AI...");
      
      const response = await generativeModel.generateContent(requestPrompt);
      const content = response.response.candidates?.[0]?.content;
      
      const firstPart = content?.parts?.[0];

      if (!firstPart) {
        throw new Error("La réponse de l'IA est vide ou ne contient pas de 'parts'.");
      }

      // Type guard: On vérifie que la partie est bien "inlineData" et non "text"
      if ("inlineData" in firstPart) {
        const inlineData = firstPart.inlineData;
        
        // ▼▼▼ CORRECTION AJOUTÉE ▼▼▼
        // On vérifie que 'inlineData' lui-même n'est pas undefined
        if (!inlineData) {
            throw new Error("La réponse de l'IA contenait 'inlineData' mais sa valeur était vide.");
        }
        // ▲▲▲ FIN DE LA CORRECTION ▲▲▲

        if (inlineData.mimeType !== "image/png") {
          throw new Error(`La réponse de l'IA n'est pas une image PNG, mais: ${inlineData.mimeType}`);
        }

        const base64Data = inlineData.data;
        logger.info("Image générée avec succès.");
        
        // 5. Renvoyer l'image en base64 au client
        return { imageUrl: `data:image/png;base64,${base64Data}` };

      } else {
        // La partie était une "TextPart" ou autre chose
        throw new Error("La réponse de l'IA ne contient pas de données d'image 'inlineData'.");
      }

    } catch (error) {
      logger.error("Erreur lors de la génération visuelle:", error);
      // Renvoyer l'erreur au client
      throw new Error(`Échec de la génération : ${error}`);
    }
  }
);