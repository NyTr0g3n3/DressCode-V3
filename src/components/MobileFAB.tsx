import React, { useState } from 'react';

interface MobileFABProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
}

const MobileFAB: React.FC<MobileFABProps> = ({ onFilesSelected, isAnalyzing }) => {
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      setShowModal(false);
    }
  };

  return (
    <>
      {/* FAB Button - Visible uniquement sur mobile */}
      <button
        onClick={() => setShowModal(true)}
        disabled={isAnalyzing}
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-gold to-gold-dark text-onyx rounded-full shadow-2xl hover:shadow-gold/50 transition-all duration-300 flex items-center justify-center z-40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        aria-label="Ajouter un vêtement"
      >
        {isAnalyzing ? (
          <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setShowModal(false)}
        >
          {/* Bottom Sheet */}
          <div 
            className="bg-white dark:bg-raisin-black w-full rounded-t-3xl p-6 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold mb-6 text-center">Ajouter un vêtement</h3>
            
            <div className="space-y-3">
              {/* Bouton Appareil Photo */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4 p-4 bg-gold/10 hover:bg-gold/20 border-2 border-gold/30 rounded-xl transition-all cursor-pointer active:scale-98">
                  <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-onyx" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Prendre une photo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Utiliser l'appareil photo</p>
                  </div>
                </div>
              </label>

              {/* Bouton Galerie */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl transition-all cursor-pointer active:scale-98">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Galerie</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choisir depuis vos photos</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Bouton Annuler */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 py-3 text-gray-500 dark:text-gray-400 font-medium"
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
