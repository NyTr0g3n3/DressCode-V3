import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import type { ClothingItem, ClothingSet, FavoriteOutfit, OutfitSuggestion } from '../types';
import { 
  listenToClothingItems,
  listenToClothingSets,
  addClothingItem,
  updateClothingItem,
  deleteClothingItem,
  addClothingSet,
  deleteClothingSet,
  listenToFavoriteOutfits,
  addFavoriteOutfit,
  deleteFavoriteOutfit
} from '../services/firestoreService';
import { analyzeClothingImages } from '../services/geminiService';
import { uploadClothingImage, uploadUserPhoto } from '../services/storageService'; // Import ajouté

interface WardrobeContextType {
  clothingItems: ClothingItem[];
  clothingSets: ClothingSet[];
  favoriteOutfits: FavoriteOutfit[];
  userModelImage: string | null; // NOUVEAU
  setUserModelImage: (url: string | null) => void; // NOUVEAU
  updateUserModelPhoto: (file: File) => Promise<void>; // NOUVEAU
  isAnalyzing: boolean;
  analyzeClothingItems: (files: File[]) => Promise<void>;
  deleteClothingItem: (itemId: string) => Promise<void>;
  updateClothingItem: (item: ClothingItem) => Promise<void>;
  createClothingSet: (name: string, itemIds: string[]) => Promise<void>;
  deleteClothingSet: (setId: string) => Promise<void>;
  addFavoriteOutfit: (outfit: OutfitSuggestion) => Promise<void>;
  deleteFavoriteOutfit: (outfitId: string) => Promise<void>;
  loading: boolean;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

interface WardrobeProviderProps {
  children: ReactNode;
  user: User | null;
}

// ... (Fonction resizeImage inchangée) ...
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        } else {
            reject(new Error("Canvas context error"));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const WardrobeProvider: React.FC<WardrobeProviderProps> = ({ children, user }) => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingSets, setClothingSets] = useState<ClothingSet[]>([]);
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([]);
  const [userModelImage, setUserModelImage] = useState<string | null>(localStorage.getItem('dressmup_user_model_url')); // Persistance simple
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sauvegarder l'URL dans le localStorage pour éviter de recharger à chaque fois
  useEffect(() => {
    if (userModelImage) {
      localStorage.setItem('dressmup_user_model_url', userModelImage);
    }
  }, [userModelImage]);

  useEffect(() => {
    if (user) {
      const unsubscribeItems = listenToClothingItems(user.uid, (items) => {
        setClothingItems(items);
        setLoading(false);
      });
      
      const unsubscribeSets = listenToClothingSets(user.uid, (sets) => {
        setClothingSets(sets);
      });

      const unsubscribeFavs = listenToFavoriteOutfits(user.uid, (favs) => { 
        setFavoriteOutfits(favs);
      });

      return () => {
        unsubscribeItems();
        unsubscribeSets();
        unsubscribeFavs();
      };
    } else {
      setClothingItems([]);
      setClothingSets([]);
      setFavoriteOutfits([]);
      setLoading(false);
    }
  }, [user]);

  // NOUVEAU : Fonction pour mettre à jour la photo de profil
  const updateUserModelPhotoCallback = useCallback(async (file: File) => {
    if (!user) return;
    try {
      const url = await uploadUserPhoto(user.uid, file);
      setUserModelImage(url);
    } catch (err) {
      console.error("Erreur mise à jour photo modèle:", err);
      throw err;
    }
  }, [user]);

  // ... (Le reste des callbacks analyze, delete, update reste inchangé) ...
  const analyzeClothingItems = useCallback(async (files: File[]) => {
    if (files.length === 0 || !user) return;
    setIsAnalyzing(true);
    try {
      const imagePromises = files.map(file => resizeImage(file));
      const imageDataUrls = await Promise.all(imagePromises);
      const base64Images = imageDataUrls.map(url => url.split(',')[1]);
      const analysisResults = await analyzeClothingImages(base64Images);
      const itemsCount = Math.min(analysisResults.length, files.length);

      for (let i = 0; i < itemsCount; i++) {
        const itemAnalysis = analysisResults[i];
        let newItemId = '';
        try {
          newItemId = await addClothingItem(user.uid, {
            ...itemAnalysis,
            createdAt: Date.now()
          });
          const imageUrl = await uploadClothingImage(user.uid, imageDataUrls[i], newItemId);
          await updateClothingItem(user.uid, newItemId, { imageSrc: imageUrl });
        } catch (uploadError) {
          console.error(`Échec pour ${files[i].name}.`, uploadError);
          if (newItemId) await deleteClothingItem(user.uid, newItemId);
        }
      }
    } catch (err) {
      console.error("Erreur lot:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const deleteClothingItemCallback = useCallback(async (itemId: string) => {
    if (!user) return;
    await deleteClothingItem(user.uid, itemId);
  }, [user]);

  const updateClothingItemCallback = useCallback(async (updatedItem: ClothingItem) => {
    if (!user) return;
    await updateClothingItem(user.uid, updatedItem.id, updatedItem);
  }, [user]);

  const addFavoriteOutfitCallback = useCallback(async (outfit: OutfitSuggestion) => {
    if (!user) return;
    const { id, ...outfitData } = outfit as any; 
    await addFavoriteOutfit(user.uid, outfitData);
  }, [user]);

  const deleteFavoriteOutfitCallback = useCallback(async (outfitId: string) => {
    if (!user) return;
    await deleteFavoriteOutfit(user.uid, outfitId);
  }, [user]);

  const createClothingSetCallback = useCallback(async (name: string, itemIds: string[]) => {
    if (!user) return;
    const firstItemImage = clothingItems.find(item => item.id === itemIds[0])?.imageSrc || '';
    const newSetData = { name, itemIds, imageSrc: firstItemImage };
    await addClothingSet(user.uid, newSetData);
  }, [user, clothingItems]);

  const deleteClothingSetCallback = useCallback(async (setId: string) => {
    if (!user) return;
    await deleteClothingSet(user.uid, setId);
  }, [user]);

  const value = {
    clothingItems,
    clothingSets,
    favoriteOutfits,
    userModelImage, // Export du state
    setUserModelImage,
    updateUserModelPhoto: updateUserModelPhotoCallback, // Export de la fonction
    isAnalyzing,
    analyzeClothingItems,
    deleteClothingItem: deleteClothingItemCallback,
    updateClothingItem: updateClothingItemCallback,
    createClothingSet: createClothingSetCallback,
    deleteClothingSet: deleteClothingSetCallback,
    addFavoriteOutfit: addFavoriteOutfitCallback, 
    deleteFavoriteOutfit: deleteFavoriteOutfitCallback,
    loading,
  };

  return (
    <WardrobeContext.Provider value={value}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe doit être utilisé à l\'intérieur d\'un WardrobeProvider');
  }
  return context;
};
