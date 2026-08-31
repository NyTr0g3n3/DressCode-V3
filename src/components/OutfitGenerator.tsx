import React from 'react';
import { SparklesIcon } from './icons.tsx';
import type { ClothingItem, ClothingSet } from '../types';
import { buildWeatherContext, getWeatherDayLabel, type WeatherDay, type TomorrowForecast } from '../utils/weatherContext.ts';

interface OutfitGeneratorProps {
  onGenerate: (occasion: string) => void; // 'context' devient 'occasion'
  isGenerating: boolean;
  weatherInfo: string | null; // Nouvelle prop
  weatherError: string | null; // Nouvelle prop
  weatherMaxToday?: number | null; // Température max prévue pour le reste de la journée
  weatherDay: WeatherDay; // Aujourd'hui ou demain (préparer sa tenue le soir pour le lendemain)
  onChangeWeatherDay: (day: WeatherDay) => void;
  tomorrowForecast?: TomorrowForecast | null;
  anchorItem?: ClothingItem | ClothingSet | null; // Item ancré pour générer une tenue autour de lui
  onClearAnchor?: () => void; // Fonction pour effacer l'ancre
}

const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({
  onGenerate,
  isGenerating,
  weatherInfo,
  weatherError,
  weatherMaxToday,
  weatherDay,
  onChangeWeatherDay,
  tomorrowForecast,
  anchorItem,
  onClearAnchor
}) => {
  const displayedWeather = buildWeatherContext(weatherDay, weatherInfo, weatherMaxToday, tomorrowForecast);
  const [occasion, setOccasion] = React.useState(''); // 'context' renommé en 'occasion'

  // Obtenir le nom/description de l'item ancré
  const anchorItemName = anchorItem
    ? ('name' in anchorItem ? anchorItem.name : anchorItem.analysis)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeOccasion = occasion || 'Casual'; // Mettre "Casual" par défaut si vide
    onGenerate(safeOccasion);
  };
  
  const presets = ["Casual", "Soirée chic", "Travail (formel)"];

  return (
    <div>
      {/* FIX: Suppression du h2 "Créateur de Tenues" (en double avec la modale) */}

      {/* AFFICHAGE DE L'ITEM ANCRÉ */}
      {anchorItemName && (
        <div className="mb-4 p-3 rounded-lg bg-gold/10 border border-gold/30 relative">
          <p className="text-sm font-semibold text-gold-dark dark:text-gold text-center pr-8">
            🎯 Créer une tenue avec : <span className="font-bold">{anchorItemName}</span>
          </p>
          {onClearAnchor && (
            <button
              type="button"
              onClick={onClearAnchor}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gold/20 rounded-full transition-colors"
              aria-label="Supprimer l'ancre"
              title="Générer sans cet article"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* AFFICHAGE DE LA MÉTÉO */}
      <div className="text-center mb-6 p-3 rounded-lg bg-snow dark:bg-onyx border border-black/10 dark:border-white/10">
        <div className="flex justify-center gap-1.5 mb-2">
          <button
            type="button"
            onClick={() => onChangeWeatherDay('today')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              weatherDay === 'today'
                ? 'bg-gold text-onyx'
                : 'bg-white dark:bg-raisin-black border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => onChangeWeatherDay('tomorrow')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              weatherDay === 'tomorrow'
                ? 'bg-gold text-onyx'
                : 'bg-white dark:bg-raisin-black border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            Demain
          </button>
        </div>
        {displayedWeather && (
          <p className="text-sm font-medium text-blue-500 dark:text-blue-400">
            {getWeatherDayLabel(weatherDay)} : {displayedWeather} 📍
          </p>
        )}
        {!displayedWeather && weatherDay === 'tomorrow' && !weatherError && (
          <p className="text-sm font-medium text-gray-400">
            Prévisions pour demain indisponibles.
          </p>
        )}
        {weatherError && (
          <p className="text-sm font-medium text-red-500">{weatherError}</p>
        )}
        {!weatherInfo && !weatherError && (
          <p className="text-sm font-medium text-gray-400 animate-pulse">
            Récupération de la météo...
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label htmlFor="occasion" className="block text-sm font-medium text-center text-gray-500 dark:text-gray-400 mb-3">
              Pour quelle occasion ?
            </label>

            <div className="flex justify-center gap-2 mb-4">
              {presets.map((preset) => (
                  <button
                      key={preset}
                      type="button"
                      onClick={() => setOccasion(preset)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                          occasion === preset
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
              id="occasion"
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Ou décrivez... (ex: Brunch décontracté)"
              className="w-full px-4 py-3 bg-snow dark:bg-onyx border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-colors text-center"
              disabled={isGenerating}
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating} // On ne désactive que si la génération est en cours
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold text-onyx font-bold rounded-lg hover:bg-gold-dark transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <SparklesIcon />
            {isGenerating ? 'Génération...' : 'Générer des Tenues'}
          </button>

          {/* Indication temporelle */}
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ⏱️ Génération : 30-60 secondes (selon la taille de votre garde-robe)
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OutfitGenerator;
