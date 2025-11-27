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
import { uploadClothingImage } from '../services/storageService';

interface WardrobeContextType {
  clothingItems: ClothingItem[];
  clothingSets: ClothingSet[];
  favoriteOutfits: FavoriteOutfit[];
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

// --- FONCTION UTILITAIRE DE REDIMENSIONNEMENT ---
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // On limite la taille à 800px de large max (suffisant pour l'affichage et l'IA)
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Compression JPEG à 70% de qualité
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const analyzeClothingItems = useCallback(async (files: File[]) => {
    if (files.length === 0 || !user) return;
    setIsAnalyzing(true);
    
    try {
      // OPTIMISATION : On redimensionne les images AVANT de les envoyer
      // Cela rend l'upload et l'analyse beaucoup plus rapides
      const imagePromises = files.map(file => resizeImage(file));
      const imageDataUrls = await Promise.all(imagePromises);
      
      // On retire le préfixe 'data:image/jpeg;base64,' pour l'envoi à Gemini
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
          console.error(`Échec de création/upload pour ${files[i].name}.`, uploadError);
          
          if (newItemId) {
            try {
              await deleteClothingItem(user.uid, newItemId);
            } catch (deleteError) {
              console.error(`Échec suppression orphelin ${newItemId}:`, deleteError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'analyse par lot:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const deleteClothingItemCallback = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      await deleteClothingItem(user.uid, itemId);
    } catch (err) {
      console.error("Erreur suppression item:", err);
    }
  }, [user]);

  const updateClothingItemCallback = useCallback(async (updatedItem: ClothingItem) => {
    if (!user) return;
    try {
      await updateClothingItem(user.uid, updatedItem.id, updatedItem);
    } catch (err) {
      console.error("Erreur mise à jour item:", err);
    }
  }, [user]);

  const addFavoriteOutfitCallback = useCallback(async (outfit: OutfitSuggestion) => {
    if (!user) return;
    try {
      const { id, ...outfitData } = outfit as any; 
      await addFavoriteOutfit(user.uid, outfitData);
    } catch (err) {
      console.error("Erreur ajout favori:", err);
    }
  }, [user]);

  const deleteFavoriteOutfitCallback = useCallback(async (outfitId: string) => {
    if (!user) return;
    try {
      await deleteFavoriteOutfit(user.uid, outfitId);
    } catch (err) {
      console.error("Erreur suppression favori:", err);
    }
  }, [user]);

  const createClothingSetCallback = useCallback(async (name: string, itemIds: string[]) => {
    if (!user) return;
    const firstItemImage = clothingItems.find(item => item.id === itemIds[0])?.imageSrc || '';
    const newSetData = { name, itemIds, imageSrc: firstItemImage };
    try {
      await addClothingSet(user.uid, newSetData);
    } catch (err) {
      console.error("Erreur création set:", err);
    }
  }, [user, clothingItems]);

  const deleteClothingSetCallback = useCallback(async (setId: string) => {
    if (!user) return;
    try {
      await deleteClothingSet(user.uid, setId);
    } catch (err) {
      console.error("Erreur suppression set:", err);
    }
  }, [user]);

  const value = {
    clothingItems,
    clothingSets,
    favoriteOutfits,
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
