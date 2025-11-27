import React, { useState, useEffect } from 'react';
import type { ClothingItem, ClothingSet, Category } from '../types.ts';
import { XIcon, SparklesIcon, UnlinkIcon, CheckCircleIcon, RemoveIcon, HeartIcon, HeartIconSolid } from './icons.tsx';

interface ClothingDetailModalProps {
  item: ClothingItem;
  clothingSets: ClothingSet[];
  onClose: () => void;
  onUpdate: (item: ClothingItem) => void;
  onGenerateFrom: (item: ClothingItem) => void;
  onRemoveSet: (setId: string) => void;
  onDelete: (itemId: string) => void;
}

const ClothingDetailModal: React.FC<ClothingDetailModalProps> = ({ 
    item, 
    clothingSets, 
    onClose, 
    onUpdate, 
    onGenerateFrom, 
    onRemoveSet, 
    onDelete 
}) => {
    const [formData, setFormData] = useState<Omit<ClothingItem, 'id' | 'imageSrc'>>({
        analysis: item.analysis,
        category: item.category,
        color: item.color,
        material: item.material
    });

    const [isSaved, setIsSaved] = useState(false);
    
    const belongingSet = clothingSets.find(set => set.itemIds.includes(item.id));

    useEffect(() => {
        setFormData({
            analysis: item.analysis,
            category: item.category,
            color: item.color,
            material: item.material
        });
    }, [item]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
      // Focus le premier élément interactif
const modal = document.querySelector('[role="dialog"]');
const firstFocusable = modal?.querySelector('button, input, textarea, select') as HTMLElement;
firstFocusable?.focus();
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({ ...item, ...formData });
        setIsSaved(true);
        setTimeout(() => {
          setIsSaved(false);
        }, 2000);
    };

    const handleDelete = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.")) {
            onDelete(item.id);
            onClose();
        }
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation(); // Empêche la modale de se fermer
        onUpdate({ ...item, isFavorite: !item.isFavorite });
    };
  
    return (
        <div
            className="fixed inset-0 bg-onyx/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clothing-item-title"
        >
            <div
                className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <img src={item.imageSrc} alt={item.analysis} className="w-full h-auto max-h-[50vh] object-cover" />

                  <button
                        onClick={handleToggleFavorite}
                        className="absolute top-3 left-3 p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                        aria-label="Ajouter aux favoris"
                    >
                        {item.isFavorite ? (
                            <HeartIconSolid className="w-6 h-6 text-red-500" />
                        ) : (
                            <HeartIcon className="w-6 h-6" />
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold dark:focus:ring-offset-raisin-black"
                        aria-label="Fermer la vue détaillée"
                    >
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow flex flex-col">
                    <div className="space-y-4 flex-grow">
                        <div>
                            <label htmlFor="analysis" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                            <textarea id="analysis" name="analysis" value={formData.analysis} onChange={handleChange} rows={3} className="mt-1 w-full px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Catégorie</label>
                                <select id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full appearance-none px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow">
                                    {(['Hauts', 'Bas', 'Chaussures', 'Accessoires'] as Category[]).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="color" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Couleur</label>
                                <input type="text" id="color" name="color" value={formData.color} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow" />
                            </div>
                            <div>
                                <label htmlFor="material" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Matière</label>
                                <input type="text" id="material" name="material" value={formData.material} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow" />
                            </div>
                        </div>
                        {belongingSet && (
                            <div className="bg-gold/10 dark:bg-gold/20 p-3 rounded-lg flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gold uppercase tracking-wider">Fait partie de l'ensemble</p>
                                    <p className="font-medium text-onyx dark:text-snow truncate" title={belongingSet.name}>{belongingSet.name}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        onRemoveSet(belongingSet.id);
                                        onClose();
                                    }}
                                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-white dark:bg-onyx text-rose-500 border border-rose-500/50 rounded-md hover:bg-rose-500 hover:text-white transition-colors"
                                    title="Dissocier l'ensemble"
                                >
                                    <UnlinkIcon />
                                    <span>Dissocier</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row gap-3 justify-between">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-lg hover:bg-red-500/20 transition-all duration-300"
                        >
                            <RemoveIcon />
                            Supprimer
                        </button>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => onGenerateFrom(item)}
                                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-onyx dark:bg-snow border-2 border-gold text-gold dark:text-onyx font-bold rounded-lg hover:bg-gold/10 dark:hover:bg-onyx/10 transition-all duration-300"
                            >
                                <SparklesIcon />
                                Créer une tenue
                            </button>
                            <button
                                type="submit"
                                disabled={isSaved}
                                className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                    isSaved
                                        ? 'bg-green-600 text-white cursor-not-allowed'
                                        : 'bg-gold text-onyx hover:bg-gold-dark'
                                }`}
                            >
                                {isSaved ? (
                                    <>
                                        <CheckCircleIcon />
                                        Enregistré !
                                    </>
                                ) : (
                                    'Enregistrer'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ClothingDetailModal;
