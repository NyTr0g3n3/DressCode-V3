import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BottomSheet } from 'react-spring-bottom-sheet';
import type { ClothingItem, ClothingSet, Category } from '../types.ts';
import { SparklesIcon, UnlinkIcon, CheckCircleIcon, RemoveIcon, HeartIcon, HeartIconSolid, EyeSlashIcon } from './icons.tsx';

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
        subcategory: item.subcategory,
        color: item.color,
        material: item.material
    });

    const [isSaved, setIsSaved] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isVisible, setIsVisible] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isDarkMode = document.documentElement.classList.contains('dark');

    const belongingSet = clothingSets.find(set => set.itemIds.includes(item.id));

    useEffect(() => {
        setFormData({
            analysis: item.analysis,
            category: item.category,
            subcategory: item.subcategory,
            color: item.color,
            material: item.material
        });
        // Trigger animation on mount
        setIsVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });
    }, [item]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isMobile, onClose]);

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

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete(item.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ ...item, isFavorite: !item.isFavorite });
    };

    const handleToggleExclude = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ ...item, isExcluded: !item.isExcluded });
    };

    // Contenu réutilisable du formulaire
    const modalContent = (
        <div className="bg-white dark:bg-raisin-black text-raisin-black dark:text-snow">
            <div className="relative px-4 pt-2 pb-4">
                <img src={item.imageSrc} alt={item.analysis} className="w-full h-auto max-h-[40vh] object-contain rounded-lg" />
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

                        {/* Sous-catégorie (uniquement pour les accessoires) */}
                        {formData.category === 'Accessoires' && (
                            <div>
                                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Type d'accessoire</label>
                                <select
                                    id="subcategory"
                                    name="subcategory"
                                    value={formData.subcategory || ''}
                                    onChange={handleChange}
                                    className="mt-1 w-full appearance-none px-3 py-2 bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors text-sm text-raisin-black dark:text-snow"
                                >
                                    <option value="">-- Sélectionner --</option>
                                    <option value="Montres & Bijoux">Montres & Bijoux</option>
                                    <option value="Écharpes & Foulards">Écharpes & Foulards</option>
                                    <option value="Ceintures">Ceintures</option>
                                    <option value="Lunettes">Lunettes</option>
                                    <option value="Chapeaux">Chapeaux</option>
                                    <option value="Sacs">Sacs</option>
                                </select>
                            </div>
                        )}

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
                            onClick={handleDeleteClick}
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
    );

    // Modale de confirmation de suppression - Utilise un Portal pour garantir qu'elle est au-dessus de tout
    const deleteConfirmModal = showDeleteConfirm ? createPortal(
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 transition-opacity duration-200"
            style={{ zIndex: 999999, pointerEvents: 'auto' }}
            onClick={handleCancelDelete}
        >
            <div
                className="bg-white dark:bg-raisin-black rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-200 scale-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Image miniature */}
                <div className="flex items-start gap-4 mb-4">
                    <img
                        src={item.imageSrc}
                        alt={item.analysis}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-raisin-black dark:text-snow mb-1">
                            Supprimer cet article ?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {item.analysis}
                        </p>
                    </div>
                </div>

                {/* Message d'avertissement */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                                Cette action est irréversible
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-400">
                                L'article sera définitivement supprimé de votre garde-robe et ne pourra pas être récupéré.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelDelete();
                        }}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDelete();
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    // Version mobile : BottomSheet
    if (isMobile) {
        return (
            <>
                <BottomSheet
                open={!!item && !showDeleteConfirm}
                onDismiss={onClose}
                className={isDarkMode ? 'dark' : ''}
                header={
                    <div className="flex items-center justify-between w-full px-4 py-2">
                        <h2 className="text-lg font-bold text-raisin-black dark:text-snow">Détails de l'article</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleToggleExclude}
                                className={`p-1.5 rounded-full transition-colors ${
                                    item.isExcluded
                                        ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                                aria-label={item.isExcluded ? "Inclure dans les suggestions" : "Exclure des suggestions"}
                                title={item.isExcluded ? "Inclure dans les suggestions" : "Ne pas suggérer cet article"}
                            >
                                <EyeSlashIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                aria-label="Ajouter aux favoris"
                            >
                                {item.isFavorite ? (
                                    <HeartIconSolid className="w-6 h-6 text-red-500" />
                                ) : (
                                    <HeartIcon className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                }
                defaultSnap={({ maxHeight }) => maxHeight * 0.85}
                snapPoints={({ maxHeight }) => [
                    maxHeight * 0.5,
                    maxHeight * 0.85,
                    maxHeight * 0.95
                ]}
            >
                {modalContent}
            </BottomSheet>
            {deleteConfirmModal}
            </>
        );
    }

    // Version desktop : Modal classique
    return (
        <>
        <div
            className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={showDeleteConfirm ? { pointerEvents: 'none' } : undefined}
            onClick={onClose}
        >
            <div
                className={`relative bg-white dark:bg-raisin-black rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={showDeleteConfirm ? { pointerEvents: 'none' } : undefined}
                onClick={e => e.stopPropagation()}
            >
                {/* Header desktop avec X */}
                <div className="sticky top-0 bg-white dark:bg-raisin-black border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-raisin-black dark:text-snow">Détails de l'article</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleExclude}
                            className={`p-2 rounded-full transition-colors ${
                                item.isExcluded
                                    ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            aria-label={item.isExcluded ? "Inclure dans les suggestions" : "Exclure des suggestions"}
                            title={item.isExcluded ? "Inclure dans les suggestions" : "Ne pas suggérer cet article"}
                        >
                            <EyeSlashIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleToggleFavorite}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
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
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            aria-label="Fermer"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                {modalContent}
            </div>
        </div>
        {deleteConfirmModal}
        </>
    );
};

export default ClothingDetailModal;
