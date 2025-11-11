import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  addDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ClothingItem, ClothingSet } from '../types';

// Types pour les nouveaux items/sets (l'ID sera généré par Firestore)
type NewClothingItem = Omit<ClothingItem, 'id'>;
type NewClothingSet = Omit<ClothingSet, 'id'>;

// --- CLOTHING ITEMS ---

/**
 * Charge TOUS les vêtements de la sous-collection 'items' de l'utilisateur.
 */
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

/**
 * Ajoute UN nouveau vêtement à la collection 'items' de l'utilisateur.
 * Retourne le nouvel ID généré par Firestore.
 */
export const addClothingItem = async (userId: string, item: NewClothingItem): Promise<string> => {
  try {
    const itemsCol = collection(db, 'users', userId, 'items');
    const docRef = await addDoc(itemsCol, item);
    return docRef.id; // Retourne le nouvel ID
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un vêtement:", error);
    throw error;
  }
};

/**
 * Met à jour UN vêtement spécifique dans la collection 'items' de l'utilisateur.
 */
export const updateClothingItem = async (userId: string, itemId: string, updates: Partial<ClothingItem>) => {
  try {
    const itemDoc = doc(db, 'users', userId, 'items', itemId);
    await updateDoc(itemDoc, updates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un vêtement:", error);
    throw error;
  }
};

/**
 * Supprime UN vêtement spécifique de la collection 'items' de l'utilisateur.
 */
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

/**
 * Charge TOUS les ensembles de la sous-collection 'sets' de l'utilisateur.
 */
export const loadClothingSets = async (userId: string): Promise<ClothingSet[]> => {
  try {
    // C'est bien la collection 'sets' ici
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

/**
 * Ajoute UN nouvel ensemble à la collection 'sets' de l'utilisateur.
 * Retourne le nouvel ID généré par Firestore.
 */
export const addClothingSet = async (userId: string, set: NewClothingSet): Promise<string> => {
  try {
    const setsCol = collection(db, 'users', userId, 'sets');
    const docRef = await addDoc(setsCol, set);
    return docRef.id; // Retourne le nouvel ID
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un ensemble:", error);
    throw error;
  }
};

/**
 * Met à jour UN ensemble spécifique dans la collection 'sets' de l'utilisateur.
 */
export const updateClothingSet = async (userId: string, setId: string, updates: Partial<ClothingSet>) => {
  try {
    const setDoc = doc(db, 'users', userId, 'sets', setId);
    await updateDoc(setDoc, updates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un ensemble:", error);
    throw error;
  }
};

/**
 * Supprime UN ensemble spécifique de la collection 'sets' de l'utilisateur.
 */
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
    // On utilise l'ID de l'item existant
    const itemDoc = doc(db, 'users', userId, 'items', item.id);
    // On sépare l'ID du reste des données
    const { id, ...itemData } = item;
    // On crée le document avec setDoc
    await setDoc(itemDoc, itemData);
  } catch (error) {
    console.error("Erreur lors de la migration de l'item:", item.id, error);
  }
};
