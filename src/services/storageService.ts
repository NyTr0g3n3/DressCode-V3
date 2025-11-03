import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadClothingImage = async (userId: string, imageBase64: string, itemId: string): Promise<string> => {
  try {
    // Créer une référence unique pour l'image
    const imageRef = ref(storage, `users/${userId}/clothing/${itemId}.jpg`);
    
    // Upload l'image en base64
    await uploadString(imageRef, imageBase64, 'data_url');
    
    // Récupérer l'URL publique
    const downloadURL = await getDownloadURL(imageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    throw error;
  }
};
