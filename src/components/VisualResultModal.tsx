import React, { useEffect } from 'react';
import { XIcon } from './icons.tsx';

interface VisualResultModalProps {
  imageUrl: string;
  onClose: () => void;
}

const VisualResultModal: React.FC<VisualResultModalProps> = ({ imageUrl, onClose }) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-onyx/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-3 md:p-2 bg-raisin-black/90 border-2 border-white/20 rounded-full text-white hover:bg-red-500 hover:border-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-gold z-[110] active:scale-95"
        aria-label="Fermer"
      >
        <XIcon />
      </button>

      <div 
        className="relative bg-white dark:bg-raisin-black rounded-lg shadow-2xl p-4 max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Rendu visuel de la tenue" 
          className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg" 
        />

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          Rendu généré par IA (image factice).
        </p>
      </div>
    </div>
  );
};

export default VisualResultModal;
