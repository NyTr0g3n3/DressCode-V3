import React, { useRef, useState } from 'react';
import { CameraIcon, LoadingSpinner, CheckCircleIcon } from './icons';
import { useWardrobe } from '../contexts/WardrobeContext';

interface ModelProfileModalProps {
  onClose: () => void;
}

const ModelProfileModal: React.FC<ModelProfileModalProps> = ({ onClose }) => {
  const { userModelImage, updateUserModelPhoto } = useWardrobe();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(userModelImage);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immédiat
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setIsUploading(true);
    try {
      await updateUserModelPhoto(file);
    } catch (error) {
      alert("Erreur lors de l'envoi de la photo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-raisin-black rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        
        <h2 className="text-2xl font-serif font-bold text-center mb-2 text-gold">Mon Mannequin Virtuel</h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ajoutez une photo de vous (de plain-pied idéalement) pour essayer vos tenues virtuellement.
        </p>

        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="relative aspect-[3/4] bg-gray-100 dark:bg-onyx rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gold transition-colors group"
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {preview ? (
            <img src={preview} alt="Mon mannequin" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <CameraIcon />
              <span className="mt-2 text-sm font-medium">Ajouter une photo</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <LoadingSpinner className="h-8 w-8 text-white mb-2" />
              <span className="text-sm font-medium">Envoi en cours...</span>
            </div>
          )}

          {!isUploading && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/90 text-onyx px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                Changer la photo
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-colors"
          >
            Terminé
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModelProfileModal;
