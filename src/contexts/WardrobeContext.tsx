import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import type { ClothingItem, ClothingSet } from '../types';
import { 
  listenToClothingItems,
  listenToClothingSets,
  addClothingItem,
  updateClothingItem,
  deleteClothingItem,
  addClothingSet,
  deleteClothingSet 
} from '../services/firestoreService';
import { analyzeClothingImages } from '../services/geminiService';
import { uploadClothingImage } from '../services/storageService';

interface WardrobeContextType {
  clothingItems: ClothingItem[];
  clothingSets: ClothingSet[];
  isAnalyzing: boolean;
  analyzeClothingItems: (files: File[]) => Promise<void>;
  deleteClothingItem: (itemId: string) => Promise<void>;
  updateClothingItem: (item: ClothingItem) => Promise<void>;
  createClothingSet: (name: string, itemIds: string[]) => Promise<void>;
  deleteClothingSet: (setId: string) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

interface WardrobeProviderProps {
  children: ReactNode;
  user: User | null;
}

export const WardrobeProvider: React.FC<WardrobeProviderProps> = ({ children, user }) => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingSets, setClothingSets] = useState<ClothingSet[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribeItems = listenToClothingItems(user.uid, (items) => {
        setClothingItems(items);
      });
      
      const unsubscribeSets = listenToClothingSets(user.uid, (sets) => {
        setClothingSets(sets);
      });

      return () => {
        unsubscribeItems();
        unsubscribeSets();
      };
    } else {
      setClothingItems([]);
      setClothingSets([]);
    }
  }, [user]);

  
  const analyzeClothingItems = useCallback(async (files: File[]) => {
    if (files.length === 0 || !user) return;
    setIsAnalyzing(true);
    
    try {
      const imagePromises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      const imageDataUrls = await Promise.all(imagePromises);
      const base64Images = imageDataUrls.map(url => url.split(',')[1]);
      
      const analysisResults = await analyzeClothingImages(base64Images);
      
      const itemsCount = Math.min(analysisResults.length, files.length);

      for (let i = 0; i < itemsCount; i++) {
        const itemAnalysis = analysisResults[i];
        let newItemId = '';
        
        try {
          newItemId = await addClothingItem(user.uid, itemAnalysis);
          const imageUrl = await uploadClothingImage(user.uid, imageDataUrls[i], newItemId);
          await updateClothingItem(user.uid, newItemId, { imageSrc: imageUrl });
          
        } catch (uploadError) {
          console.error(`Échec de création/upload pour ${files[i].name}.`, uploadError);
          
          if (newItemId) {
            console.log(`Tentative de suppression de l'article orphelin: ${newItemId}`);
            try {
              await deleteClothingItem(user.uid, newItemId);
              console.log(`Article orphelin ${newItemId} supprimé avec succès.`);
            } catch (deleteError) {
              console.error(`Échec de la suppression de l'article orphelin ${newItemId}:`, deleteError);
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
    isAnalyzing,
    analyzeClothingItems,
    deleteClothingItem: deleteClothingItemCallback,
    updateClothingItem: updateClothingItemCallback,
    createClothingSet: createClothingSetCallback,
    deleteClothingSet: deleteClothingSetCallback
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
