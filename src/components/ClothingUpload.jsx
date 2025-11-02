import React, { useRef, useState, useEffect } from 'react';
import { CameraIcon, LoadingSpinner, RemoveIcon, SparklesIcon } from './icons.jsx';

const ClothingUpload = ({ onAnalyze, isAnalyzing }) => {
  const fileInputRef = useRef(null);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
      // Nettoyage des Object URLs pour éviter les fuites de mémoire
      return () => {
          stagedFiles.forEach(sf => URL.revokeObjectURL(sf.preview));
      }
  }, [stagedFiles]);


  const addFilesToStage = (files) => {
      const newStagedFiles = Array.from(files).map(file => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file)
      }));
      setStagedFiles(prev => [...prev, ...newStagedFiles]);
  }

  const handleFileChange = (event) => {
    if (event.target.files) {
      addFilesToStage(event.target.files);
      event.target.value = ''; // Reset file input
    }
  };

  const handleMainClick = () => {
    if (isAnalyzing) return;
    fileInputRef.current?.click();
  };
  
  const handleDragEnter = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToStage(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveStagedFile = (id) => {
      const fileToRemove = stagedFiles.find(sf => sf.id === id);
      if (fileToRemove) {
          URL.revokeObjectURL(fileToRemove.preview);
      }
      setStagedFiles(prev => prev.filter(sf => sf.id !== id));
  }

  const handleAnalyzeClick = () => {
      if (stagedFiles.length > 0 && !isAnalyzing) {
          onAnalyze(stagedFiles.map(sf => sf.file));
          setStagedFiles([]); // Vider la liste après envoi
      }
  }

  return (
    <div 
      className="bg-white dark:bg-raisin-black rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 p-6 lg:p-8"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h2 className="text-2xl font-serif font-bold mb-6 text-gold">Ajouter à ma garde-robe</h2>
      <div
        onClick={handleMainClick}
        className={`relative bg-snow dark:bg-onyx rounded-lg p-12 text-center transition-all duration-300 ring-1 ring-dashed ring-black/20 dark:ring-white/20 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer hover:ring-gold dark:hover:ring-gold'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" multiple disabled={isAnalyzing} />
        
        <div className="flex flex-col items-center justify-center min-h-[8rem]">
            {isAnalyzing ? (
                <>
                    <LoadingSpinner />
                    <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">Analyse en cours...</p>
                </>
            ) : (
                <>
                    <div className="text-gray-400 dark:text-gray-600 mb-4">
                      <CameraIcon />
                    </div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      {isMobile ? "Appuyez pour ajouter des photos" : "Glissez-déposez vos photos"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ou <span className="text-gold font-medium">cliquez pour sélectionner</span>
                    </p>
                </>
            )}
        </div>
        {isDragging && !isMobile && (
          <div className="absolute inset-0 bg-gold/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center transition-opacity">
            <div className="text-black transform-gpu scale-110"><CameraIcon /></div>
            <p className="mt-2 font-bold text-lg text-black">Déposez pour ajouter</p>
          </div>
        )}
      </div>

      {stagedFiles.length > 0 && !isAnalyzing && (
        <div className="mt-8">
            <h3 className="font-semibold mb-4 text-gray-600 dark:text-gray-300">Prêts pour l'analyse :</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                {stagedFiles.map(sf => (
                    <div key={sf.id} className="relative group aspect-square">
                        <img src={sf.preview} alt={sf.file.name} className="w-full h-full object-cover rounded-md shadow-md"/>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
                        <button 
                            onClick={() => handleRemoveStagedFile(sf.id)}
                            className="absolute -top-2 -right-2 p-1 bg-raisin-black border-2 border-white dark:border-onyx rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110 focus:opacity-100"
                            aria-label="Supprimer"
                        >
                            <RemoveIcon />
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing || stagedFiles.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
            >
                <SparklesIcon />
                Analyser les {stagedFiles.length} article(s)
            </button>
        </div>
      )}
    </div>
  );
};

export default ClothingUpload;