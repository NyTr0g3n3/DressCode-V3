import React, { useState, useEffect } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import type { ClothingItem, ClothingSet, Category } from '../types.ts';
import { SparklesIcon, UnlinkIcon, CheckCircleIcon, RemoveIcon, HeartIcon, HeartIconSolid } from './icons.tsx';

interface ClothingDetailModalProps {
  item: ClothingItem;
  clothingSets: ClothingSet[];
  onClose: () => void;
  onUpdate: (item: ClothingItem) => void;
  onGenerateFrom: (item: ClothingItem) => void;
  onRemoveSet: (setId: string) => void;
  onDelete: (itemId: string) => void;
  getItemWearCount: (itemId: string) => number;
}

const ClothingDetailModal: React.FC<ClothingDetailModalProps> = ({
    item,
    clothingSets,
    onClose,
    onUpdate,
    onGenerateFrom,
    onRemoveSet,
    onDelete,
    getItemWearCount
}) => {
    const [formData, setFormData] = useState<Omit<ClothingItem, 'id' | 'imageSrc'>>({
        analysis: item.analysis,
        category: item.category,
        color: item.color,
        material: item.material
    });

    const [isSaved, setIsSaved] = useState(false);
    const isDarkMode = document.documentElement.classList.contains('dark');

    const belongingSet = clothingSets.find(set => set.itemIds.includes(item.id));

    useEffect(() => {
        setFormData({
            analysis: item.analysis,
            category: item.category,
            color: item.color,
            material: item.material
        });
    }, [item]);

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
        e.stopPropagation();
        onUpdate({ ...item, isFavorite: !item.isFavorite });
    };

    return (
        <BottomSheet
            open={!!item}
            onDismiss={onClose}
            className={isDarkMode ? 'dark' : ''}
            defaultSnap={({ maxHeight }) => maxHeight * 0.85}
            snapPoints={({ maxHeight }) => [
                maxHeight * 0.5,
                maxHeight * 0.85,
                maxHeight * 0.95
            ]}
        >
            <div className="bg-white dark:bg-raisin-black text-raisin-black dark:text-snow">
                <div className="relative">
                    <img src={item.imageSrc} alt={item.analysis} className="w-full h-auto max-h-[40vh] object-cover" />

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
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="analysis" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                            <textarea
                                id="analysis"
                                name="analysis"
                                value={formData.analysis}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 w-full px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Catégorie</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="mt-1 w-full appearance-none px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow"
                                >
                                    {(['Hauts', 'Bas', 'Chaussures', 'Accessoires'] as Category[]).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="color" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Couleur</label>
                                <input
                                    type="text"
                                    id="color"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow"
                                />
                            </div>
                            <div>
                                <label htmlFor="material" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Matière</label>
                                <input
                                    type="text"
                                    id="material"
                                    name="material"
                                    value={formData.material}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow"
                                />
                            </div>
                        </div>

                        {/* Statistique de port */}
                        <div className="bg-gradient-to-r from-gold/5 to-gold-dark/5 dark:from-gold/10 dark:to-gold-dark/10 p-3 rounded-lg border border-gold/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gold dark:text-gold-light uppercase tracking-wider">Statistique</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        Porté <span className="font-bold text-lg text-gold">{getItemWearCount(item.id)}</span> fois ces 30 derniers jours
                                    </p>
                                </div>
                                <div className="text-3xl">👕</div>
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
        </BottomSheet>
    );
};

export default ClothingDetailModal;
