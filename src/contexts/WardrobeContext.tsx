import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import type { ClothingItem, ClothingSet } from '../types';
import { 
  loadClothingItems, 
  loadClothingSets, 
  addClothingItem,
  updateClothingItem,
  deleteClothingItem,
  addClothingSet,
  deleteClothingSet 
} from '../services/firestoreService';
import { analyzeClothingImages } from '../services/geminiService';
import { uploadClothingImage } from '../services/storageService';

// 1. Définir la "forme" de notre contexte
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

// 2. Créer le contexte
const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

// 3. Créer le "Provider" (le composant qui fournit la logique)
interface WardrobeProviderProps {
  children: ReactNode;
  user: User | null; // Le Provider a besoin de savoir qui est l'utilisateur
}

export const WardrobeProvider: React.FC<WardrobeProviderProps> = ({ children, user }) => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingSets, setClothingSets] = useState<ClothingSet[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Note : On pourrait aussi déplacer 'error' ici, mais laissons-le dans App pour l'instant

  // === Effet de chargement (copié de App.tsx) ===
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const items = await loadClothingItems(user.uid);
          setClothingItems(items);
          const sets = await loadClothingSets(user.uid);
          setClothingSets(sets);
        } catch (err) {
          console.error('Erreur lors du chargement des données:', err);
        }
      } else {
        setClothingItems([]);
        setClothingSets([]);
      }
    };
    loadUserData();
  }, [user]);

  // === Fonctions logiques (copiées de App.tsx et renommées) ===
  
  const analyzeClothingItems = useCallback(async (files: File[]) => {
    if (files.length === 0 || !user) return;
    setIsAnalyzing(true);
    // Idéalement, la gestion d'erreur se ferait aussi ici
    
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
      const newItems: ClothingItem[] = [];

      for (let i = 0; i < itemsCount; i++) {
        const itemAnalysis = analysisResults[i];
        try {
          const newItemId = await addClothingItem(user.uid, itemAnalysis);
          const imageUrl = await uploadClothingImage(user.uid, imageDataUrls[i], newItemId);
          await updateClothingItem(user.uid, newItemId, { imageSrc: imageUrl });
          
          newItems.push({
            ...itemAnalysis,
            id: newItemId,
            imageSrc: imageUrl,
          });
        } catch (uploadError) {
          console.error(`Échec de création/upload pour ${files[i].name}.`, uploadError);
        }
      }
      setClothingItems(prev => [...prev, ...newItems]);
    } catch (err) {
      console.error("Erreur lors de l'analyse par lot:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const deleteClothingItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      await deleteClothingItem(user.uid, itemId);
      setClothingItems((prev) => prev.filter((item) => item.id !== itemId));
      setClothingSets((prev) =>
        prev.map((set) => ({
          ...set,
          itemIds: set.itemIds.filter((id) => id !== itemId),
        }))
      );
    } catch (err) {
      console.error("Erreur suppression item:", err);
    }
  }, [user]);

  const updateClothingItem = useCallback(async (updatedItem: ClothingItem) => {
    if (!user) return;
    try {
      await updateClothingItem(user.uid, updatedItem.id, updatedItem);
      setClothingItems((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
    } catch (err) {
      console.error("Erreur mise à jour item:", err);
    }
  }, [user]);

  const createClothingSet = useCallback(async (name: string, itemIds: string[]) => {
    if (!user) return;
    const firstItemImage = clothingItems.find(item => item.id === itemIds[0])?.imageSrc || '';
    const newSetData = { name, itemIds, imageSrc: firstItemImage };
    try {
      const newSetId = await addClothingSet(user.uid, newSetData);
      setClothingSets((prev) => [...prev, { ...newSetData, id: newSetId }]);
    } catch (err) {
      console.error("Erreur création set:", err);
    }
  }, [user, clothingItems]); // 'clothingItems' est nécessaire pour 'firstItemImage'

  const deleteClothingSet = useCallback(async (setId: string) => {
    if (!user) return;
    try {
      await deleteClothingSet(user.uid, setId);
      setClothingSets((prev) => prev.filter((set) => set.id !== setId));
    } catch (err) {
      console.error("Erreur suppression set:", err);
    }
  }, [user]);

  // 4. Définir la valeur à fournir
  const value = {
    clothingItems,
    clothingSets,
    isAnalyzing,
    analyzeClothingItems,
    deleteClothingItem,
    updateClothingItem,
    createClothingSet,
    deleteClothingSet
  };

  return (
    <WardrobeContext.Provider value={value}>
      {children}
    </WardrobeContext.Provider>
  );
};

// 5. Créer le "Hook" personnalisé pour consommer le contexte facilement
export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe doit être utilisé à l\'intérieur d\'un WardrobeProvider');
  }
  return context;
};
