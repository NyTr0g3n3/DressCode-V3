import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  addDoc,
  setDoc,
  onSnapshot,
  query
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ClothingItem, ClothingSet, FavoriteOutfit, OutfitSuggestion } from '../types';

type NewClothingItem = Omit<ClothingItem, 'id'>;
type NewClothingSet = Omit<ClothingSet, 'id'>;
type NewFavoriteOutfit = Omit<FavoriteOutfit, 'id'>;

// --- CLOTHING ITEMS ---

export const loadClothingItems = async (userId: string): Promise<ClothingItem[]> => {
  try {
    const itemsCol = collection(db, 'users', userId, 'items');
    const querySnapshot = await getDocs(itemsCol);
    
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClothingItem));
    
    return items;
  } catch (error) {
    console.error('Erreur lors du chargement des vêtements:', error);
    return [];
  }
};

export const listenToClothingItems = (userId: string, callback: (items: ClothingItem[]) => void) => {
  const itemsCol = collection(db, 'users', userId, 'items');
  const q = query(itemsCol);
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClothingItem));
    callback(items);
  }, (error) => {
    console.error('Erreur (items listener):', error);
  });
  return unsubscribe;
};

export const addClothingItem = async (userId: string, item: NewClothingItem): Promise<string> => {
  try {
    const itemsCol = collection(db, 'users', userId, 'items');
    const docRef = await addDoc(itemsCol, item);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un vêtement:", error);
    throw error;
  }
};

export const updateClothingItem = async (userId: string, itemId: string, updates: Partial<ClothingItem>) => {
  try {
    const itemDoc = doc(db, 'users', userId, 'items', itemId);
    await updateDoc(itemDoc, updates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un vêtement:", error);
    throw error;
  }
};

export const deleteClothingItem = async (userId: string, itemId: string) => {
  try {
    const itemDoc = doc(db, 'users', userId, 'items', itemId);
    await deleteDoc(itemDoc);
  } catch (error) {
    console.error("Erreur lors de la suppression d'un vêtement:", error);
    throw error;
  }
};


// --- CLOTHING SETS ---

export const loadClothingSets = async (userId: string): Promise<ClothingSet[]> => {
  try {
    const setsCol = collection(db, 'users', userId, 'sets');
    const querySnapshot = await getDocs(setsCol);
    
    const sets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClothingSet));
    
    return sets;
  } catch (error) {
    console.error('Erreur lors du chargement des ensembles:', error);
    return [];
  }
};

// --- FAVORITE OUTFITS ---

export const listenToFavoriteOutfits = (userId: string, callback: (sets: FavoriteOutfit[]) => void) => {
  const favsCol = collection(db, 'users', userId, 'favoriteOutfits');
  const q = query(favsCol);
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const favs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FavoriteOutfit));
    callback(favs);
  }, (error) => {
    console.error('Erreur (favoriteOutfits listener):', error);
  });
  return unsubscribe;
};

export const addFavoriteOutfit = async (userId: string, outfit: Omit<OutfitSuggestion, 'id'>): Promise<string> => {
  try {
    const favsCol = collection(db, 'users', userId, 'favoriteOutfits');
    // On sauvegarde l'objet OutfitSuggestion directement
    const docRef = await addDoc(favsCol, outfit);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout d'une tenue favorite:", error);
    throw error;
  }
};

export const deleteFavoriteOutfit = async (userId: string, outfitId: string) => {
  try {
    const favDoc = doc(db, 'users', userId, 'favoriteOutfits', outfitId);
    await deleteDoc(favDoc);
  } catch (error) {
    console.error("Erreur lors de la suppression d'une tenue favorite:", error);
    throw error;
  }
};

export const listenToClothingSets = (userId: string, callback: (sets: ClothingSet[]) => void) => {
  const setsCol = collection(db, 'users', userId, 'sets');
  const q = query(setsCol);
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const sets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClothingSet));
    callback(sets);
  }, (error) => {
    console.error('Erreur (sets listener):', error);
  });
  return unsubscribe;
};

export const addClothingSet = async (userId: string, set: NewClothingSet): Promise<string> => {
  try {
    const setsCol = collection(db, 'users', userId, 'sets');
    const docRef = await addDoc(setsCol, set);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un ensemble:", error);
    throw error;
  }
};

export const updateClothingSet = async (userId: string, setId: string, updates: Partial<ClothingSet>) => {
  try {
    const setDoc = doc(db, 'users', userId, 'sets', setId);
    await updateDoc(setDoc, updates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un ensemble:", error);
    throw error;
  }
};

export const deleteClothingSet = async (userId: string, setId: string) => {
  try {
    const setDoc = doc(db, 'users', userId, 'sets', setId);
    await deleteDoc(setDoc);
  } catch (error) {
    console.error("Erreur lors de la suppression d'un ensemble:", error);
    throw error;
  }
};

export const setClothingItemWithId = async (userId: string, item: ClothingItem) => {
  try {
    const itemDoc = doc(db, 'users', userId, 'items', item.id);
    const { id, ...itemData } = item;
    await setDoc(itemDoc, itemData);
  } catch (error) {
    console.error("Erreur lors de la migration de l'item:", item.id, error);
  }
};
