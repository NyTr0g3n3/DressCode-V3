import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

// Upload d'un vêtement (Base64)
export const uploadClothingImage = async (userId: string, imageBase64: string, itemId: string): Promise<string> => {
  try {
    const imageRef = ref(storage, `users/${userId}/clothing/${itemId}.jpg`);
    await uploadString(imageRef, imageBase64, 'data_url');
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Erreur upload vêtement:', error);
    throw error;
  }
};

// NOUVEAU : Upload de la photo de l'utilisateur (File)
export const uploadUserPhoto = async (userId: string, file: File): Promise<string> => {
  try {
    // On redimensionne l'image avant l'upload pour optimiser (max 1024px)
    const resizedImageBlob = await resizeImageToBlob(file, 1024);
    
    // On écrase l'ancienne photo (une seule photo de profil par utilisateur pour simplifier)
    const imageRef = ref(storage, `users/${userId}/profile/model_photo.jpg`);
    
    await uploadBytes(imageRef, resizedImageBlob);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Erreur upload photo profil:', error);
    throw error;
  }
};

// Utilitaire de redimensionnement
const resizeImageToBlob = (file: File, maxWidth: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const scaleSize = maxWidth / img.width;
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Blob creation failed"));
            }, 'image/jpeg', 0.85);
        } else {
            reject(new Error("Canvas error"));
        }
      };
    };
    reader.onerror = (error) => reject(error);
  });
};
