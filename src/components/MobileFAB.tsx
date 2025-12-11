import React, { useState, useRef } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      setIsOpen(false);
    }
    // Reset input pour permettre de re-sélectionner le même fichier
    event.target.value = '';
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  if (isOtherModalOpen) return null;

  return (
    <>
      {/* Inputs cachés */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Backdrop pour fermer le menu */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Container FAB + Menu */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        
        {/* Menu flottant */}
        <div 
          className={`absolute bottom-20 right-0 transition-all duration-300 origin-bottom-right ${
            isOpen 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="bg-white dark:bg-raisin-black rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden w-56">
            {/* Option Appareil Photo */}
            <button
              type="button"
              onClick={handleCameraClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-gold/10 active:bg-gold/20 transition-colors cursor-pointer border-b border-black/5 dark:border-white/5 text-left"
            >
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-onyx" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Appareil Photo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Prendre une photo</p>
              </div>
            </button>

            {/* Option Galerie */}
            <button
              type="button"
              onClick={handleGalleryClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors cursor-pointer text-left"
            >
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Galerie</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choisir des photos</p>
              </div>
            </button>
          </div>

          {/* Petite flèche vers le FAB */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-raisin-black rotate-45 border-r border-b border-black/10 dark:border-white/10"></div>
        </div>

        {/* FAB Button */}
        <button
          onClick={handleToggle}
          disabled={isAnalyzing}
          className={`
            relative w-16 h-16 
            bg-gradient-to-r from-gold to-gold-dark text-onyx 
            rounded-full shadow-2xl 
            transition-all duration-300 ease-out
            flex items-center justify-center
            disabled:opacity-50 disabled:cursor-not-allowed 
            active:scale-90
            ${isOpen 
              ? 'rotate-45 shadow-gold/50 ring-4 ring-gold/30' 
              : 'rotate-0 hover:scale-105 hover:shadow-gold/30'
            }
          `}
          aria-label={isOpen ? "Fermer le menu" : "Ajouter un vêtement"}
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
      </div>
    </>
  );
};

export default MobileFAB;
