import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();

/**
 * Convertit une image base64 en File object
 */
const base64ToFile = async (base64Data: string, fileName: string): Promise<File> => {
  // Déterminer le type MIME depuis le base64
  const mimeMatch = base64Data.match(/^data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // Enlever le préfixe data:image/...;base64, si présent
  const base64WithoutPrefix = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  // Convertir en blob
  const byteCharacters = atob(base64WithoutPrefix);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Créer un File depuis le Blob
  return new File([blob], fileName, { type: mimeType });
};

/**
 * Prend une ou plusieurs photos avec la caméra native ou la galerie
 */
export const takePictures = async (multiple: boolean = true): Promise<File[]> => {
  if (!isNativeApp()) {
    throw new Error('Cette fonction nécessite l\'application native');
  }

  try {
    const results: File[] = [];

    if (multiple) {
      // Pour plusieurs photos, on utilise la galerie
      const photos = await Camera.pickImages({
        quality: 90,
        limit: 10, // Maximum 10 photos à la fois
      });

      for (let i = 0; i < photos.photos.length; i++) {
        const photo = photos.photos[i];
        const fileName = `clothing_${Date.now()}_${i}.${photo.format}`;
        const file = await base64ToFile(photo.base64String || photo.webPath, fileName);
        results.push(file);
      }
    } else {
      // Pour une seule photo, on peut utiliser la caméra ou la galerie
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Laisse l'utilisateur choisir
      });

      const fileName = `clothing_${Date.now()}.${photo.format}`;
      const file = await base64ToFile(photo.base64String!, fileName);
      results.push(file);
    }

    return results;
  } catch (error) {
    console.error('Erreur lors de la capture de photo:', error);
    throw error;
  }
};

/**
 * Demande les permissions de caméra
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  if (!isNativeApp()) {
    return true; // Pas besoin de permissions dans le navigateur
  }

  try {
    const result = await Camera.requestPermissions({
      permissions: ['camera', 'photos']
    });

    return result.camera === 'granted' && result.photos === 'granted';
  } catch (error) {
    console.error('Erreur lors de la demande de permissions:', error);
    return false;
  }
};
