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
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="absolute inset-0 bg-onyx/80 backdrop-blur-md"
        style={{ zIndex: 999999 }}
      />
      
      <div 
        className="relative bg-white dark:bg-raisin-black rounded-lg shadow-2xl p-4"
        style={{ zIndex: 1000000 }}
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
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-3 -right-3 p-3 bg-red-500 border-4 border-white rounded-full text-white shadow-2xl hover:bg-red-600 active:scale-95 touch-none"
          style={{ zIndex: 1000001 }}
          aria-label="Fermer"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};

export default VisualResultModal;
