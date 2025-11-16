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

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('CLOSE CALLED');
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-onyx/80 backdrop-blur-md z-[9998]"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
        <div className="relative pointer-events-auto">
          <div className="bg-white dark:bg-raisin-black rounded-lg shadow-2xl p-4">
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
      </div>

      <button
        onClick={handleClose}
        onTouchStart={handleClose}
        className="fixed top-4 right-4 p-6 bg-red-600 border-4 border-white rounded-full text-white shadow-2xl z-[10000]"
        aria-label="Fermer"
      >
        <XIcon />
      </button>
    </>
  );
};

export default VisualResultModal;
