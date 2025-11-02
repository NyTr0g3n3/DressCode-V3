import React, { useState } from 'react';
import { SuitcaseIcon } from './icons.js';

const VacationPlanner = ({ onGenerate, isGenerating }) => {
  const [days, setDays] = useState(3);
  const [context, setContext] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (context.trim() && days > 0) {
      onGenerate(days, context);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-center mb-6 text-gold">Planificateur de Valise</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-1">
            <label htmlFor="days" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 text-center sm:text-left">
              Durée (jours)
            </label>
            <input
              id="days"
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
              min="1"
              max="30"
              className="w-full px-4 py-3 bg-snow dark:bg-onyx border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-colors text-center"
              disabled={isGenerating}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="vacation-context" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 text-center sm:text-left">
              Destination / Météo
            </label>
            <input
              id="vacation-context"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ex: Weekend à Rome, temps doux"
              className="w-full px-4 py-3 bg-snow dark:bg-onyx border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-colors text-center sm:text-left"
              disabled={isGenerating}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isGenerating || !context.trim() || days <= 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
        >
          <SuitcaseIcon />
          {isGenerating ? 'Préparation...' : 'Générer la valise'}
        </button>
      </form>
    </div>
  );
};

export default VacationPlanner;