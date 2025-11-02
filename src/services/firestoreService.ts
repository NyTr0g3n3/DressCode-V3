import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { ClothingItem, ClothingSet } from '../types';

export const saveClothingItems = async (userId: string, items: ClothingItem[]) => {
  try {
    const userDoc = doc(db, 'users', userId, 'wardrobe', 'items');
    await setDoc(userDoc, { items });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des vêtements:', error);
    throw error;
  }
};

export const loadClothingItems = async (userId: string): Promise<ClothingItem[]> => {
  try {
    const userDoc = doc(db, 'users', userId, 'wardrobe', 'items');
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des vêtements:', error);
    return [];
  }
};

export const saveClothingSets = async (userId: string, sets: ClothingSet[]) => {
  try {
    const userDoc = doc(db, 'users', userId, 'wardrobe', 'sets');
    await setDoc(userDoc, { sets });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des ensembles:', error);
    throw error;
  }
};

export const loadClothingSets = async (userId: string): Promise<ClothingSet[]> => {
  try {
    const userDoc = doc(db, 'users', userId, 'wardrobe', 'sets');
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      return docSnap.data().sets || [];
    }
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des ensembles:', error);
    return [];
  }
};
