import React, { useState } from 'react';
import { hapticFeedback } from '../utils/haptics';

interface MobileFABProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
  isOtherModalOpen: boolean; 
}

const MobileFAB: React.FC<MobileFABProps> = ({ 
  onFilesSelected, 
  isAnalyzing, 
  isOtherModalOpen 
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      setShowModal(false);
    }
  };

  const handleOpenModal = () => {
    hapticFeedback.medium();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    hapticFeedback.light();
    setShowModal(false);
  };

  return (
    <>
      {/* FAB Button */}
      {!isOtherModalOpen && (
        <button
          onClick={handleOpenModal}
          disabled={isAnalyzing}
          className={`
            md:hidden fixed bottom-24 right-6 w-16 h-16 
            bg-gradient-to-r from-gold to-gold-dark text-onyx 
            rounded-full shadow-2xl 
            transition-all duration-300 ease-out
            flex items-center justify-center z-40 
            disabled:opacity-50 disabled:cursor-not-allowed 
            active:scale-90
            ${showModal ? 'rotate-45 scale-110 shadow-gold/50' : 'rotate-0 scale-100 hover:scale-105 hover:shadow-gold/30'}
          `}
          aria-label="Ajouter un vêtement"
        >
          {isAnalyzing ? (
            <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg 
              className="w-8 h-8 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
          onClick={handleCloseModal}
        >
          {/* Bottom Sheet */}
          <div 
            className="bg-white dark:bg-raisin-black w-full rounded-t-3xl p-6 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold mb-6 text-center">Ajouter un vêtement</h3>
            
            <div className="space-y-3">
              {/* Option Appareil Photo */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gold/10 to-gold-dark/10 hover:from-gold/20 hover:to-gold-dark/20 border-2 border-gold/30 rounded-xl transition-all cursor-pointer active:scale-[0.98]">
                  <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-onyx" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Appareil Photo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Prendre une photo</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </label>

              {/* Option Galerie */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-transparent rounded-xl transition-all cursor-pointer active:scale-[0.98]">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Galerie</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choisir depuis vos photos</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </label>
            </div>

            {/* Bouton Annuler */}
            <button
              onClick={handleCloseModal}
              className="w-full mt-6 py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileFAB;
