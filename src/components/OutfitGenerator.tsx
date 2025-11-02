import React from 'react';
import { SparklesIcon } from './icons.tsx';

interface OutfitGeneratorProps {
  onGenerate: (context: string) => void;
  isGenerating: boolean;
  context: string;
  setContext: (value: string) => void;
}

const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({ onGenerate, isGenerating, context, setContext }) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (context.trim()) {
      onGenerate(context);
    }
  };
  
  const presets = ["Casual", "Chic", "Formel"];

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-center mb-6 text-gold">Créateur de Tenues</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-center text-gray-500 dark:text-gray-400 mb-3">
              Pour quelle occasion ou météo ?
            </label>

            <div className="flex justify-center gap-2 mb-4">
              {presets.map((preset) => (
                  <button
                      key={preset}
                      type="button"
                      onClick={() => setContext(preset)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                          context === preset
                              ? 'bg-gold text-onyx'
                              : 'bg-snow dark:bg-onyx border border-gray-300 dark:border-gray-700 hover:border-gold dark:hover:border-gold text-gray-700 dark:text-gray-300'
                      }`}
                      disabled={isGenerating}
                  >
                      {preset}
                  </button>
              ))}
            </div>

            <input
              id="context"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ou décrivez... Ex: un brunch ensoleillé"
              className="w-full px-4 py-3 bg-snow dark:bg-onyx border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-colors text-center"
              disabled={isGenerating}
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !context.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <SparklesIcon />
            {isGenerating ? 'Génération...' : 'Générer des Tenues'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OutfitGenerator;