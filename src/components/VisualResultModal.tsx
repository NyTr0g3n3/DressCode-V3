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

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-onyx/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <div 
          className="bg-white dark:bg-raisin-black rounded-lg shadow-2xl p-4"
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
        
        <button
          onClick={handleButtonClick}
          onTouchEnd={handleButtonClick}
          className="fixed top-4 right-4 p-4 bg-red-500 border-4 border-white rounded-full text-white shadow-2xl z-[9999] active:scale-90"
          style={{ touchAction: 'manipulation' }}
          aria-label="Fermer"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};

export default VisualResultModal;
