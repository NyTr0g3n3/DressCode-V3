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
import type { ClothingItem, ClothingSet } from '../types';

type NewClothingItem = Omit<ClothingItem, 'id'>;
type NewClothingSet = Omit<ClothingSet, 'id'>;

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
