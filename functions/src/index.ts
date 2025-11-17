import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { VertexAI } from "@google-cloud/vertexai";

// Initialiser Firebase Admin
initializeApp();

// --- CONFIGURATION VERTEX AI (IMAGEN) ---
const PROJECT_ID = "dresscode-ai-32c50"; 
const GCS_BUCKET_NAME = "dresscode-ai-32c50.firebasestorage.app"; 
const STORAGE_URL_DOMAIN = "dresscode-ai-32c50.firebasestorage.app";

// ▼▼▼ CORRECTION : On utilise la région de votre screenshot ▼▼▼
const LOCATION = "us-central1"; 
    
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION, 
});

const bucket = getStorage().bucket(GCS_BUCKET_NAME);

// ▼▼▼ CORRECTION : Le nom de modèle exact de VOTRE screenshot ▼▼▼
const generativeModel = vertexAI.getGenerativeModel({
  model: "imagen-3.0-fast-generate-001",
});
// ▲▲▲ FIN DE LA CORRECTION ▲▲▲
// ------------------------------------------


async function urlToGenerativePart(url: string, mimeType: string) {
  logger.info("Conversion de l'URL Storage:", url);

  const prefix = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_URL_DOMAIN}/o/`;

  if (!url.startsWith(prefix)) {
    throw new Error(`URL de stockage invalide ou ne provenant pas du bon bucket. Attendu: ${prefix}, Reçu: ${url}`);
  }

  const filePathWithToken = url.substring(prefix.length);
  const filePath = decodeURIComponent(filePathWithToken.split("?")[0]);
  
  logger.info("Téléchargement du fichier via Admin SDK:", filePath);

  const file = bucket.file(filePath);
  const [buffer] = await file.download(); 
  
  const base64Data = buffer.toString("base64");

  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

export const generateVisualOutfitOnServer = onCall(
  { 
    cors: true, 
    timeoutSeconds: 300, 
    memory: "1GiB"
  },
  async (request) => {
    logger.info("Début de la génération visuelle...", { structuredData: true });

    try {
      const items = request.data.items as any[];
      const context = request.data.context as string;

      if (!items || items.length === 0 || !context) {
        throw new Error("Données manquantes : items et context sont requis.");
      }

      const imageParts = await Promise.all(
        items.slice(0, 3).map((item) => 
          urlToGenerativePart(item.imageSrc, "image/jpeg")
        )
      );

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
      
      const requestPrompt = {
        contents: [
          {
            role: "user",
            parts: [
              ...imageParts, 
              { text: textPrompt },
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

      if ("inlineData" in firstPart && firstPart.inlineData) {
        const inlineData = firstPart.inlineData;
        
        if (inlineData.mimeType !== "image/png") {
          throw new Error(`La réponse de l'IA n'est pas une image PNG, mais: ${inlineData.mimeType}`);
        }

        const base64Data = inlineData.data;
        logger.info("Image générée avec succès.");
        
        return { imageUrl: `data:image/png;base64,${base64Data}` };

      } else {
        throw new Error("La réponse de l'IA ne contient pas de données d'image 'inlineData'.");
      }

    } catch (error: any) { 
      logger.error("Erreur DÉTAILLÉE lors de la génération:", error.message, {fullError: error});
      throw new Error(`Échec de la génération : ${error.message}`);
    }
  }
);
