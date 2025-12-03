import React from 'react';
import type { WardrobeAnalysis } from '../types';

interface WardrobeSuggestionsProps {
  analysis: WardrobeAnalysis | null;
  onClose: () => void;
}

const WardrobeSuggestions: React.FC<WardrobeSuggestionsProps> = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const priorityColors = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
  };

  const priorityLabels = {
    high: 'Priorité haute',
    medium: 'Priorité moyenne',
    low: 'Bonne idée'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-raisin-black rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gold to-gold-dark p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold text-onyx">
              💡 Suggestions d'Achats
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-full transition"
            >
              <svg className="w-6 h-6 text-onyx" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Résumé */}
          <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
            <h3 className="font-semibold text-lg mb-2">📊 Analyse de votre garde-robe</h3>
            <p className="text-gray-700 dark:text-gray-300">{analysis.summary}</p>
          </div>

          {/* Points forts */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-green-500">✓</span> Points forts
            </h3>
            <div className="grid gap-2">
              {analysis.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-orange-500">⚠</span> Opportunités d'amélioration
            </h3>
            <div className="grid gap-2">
              {analysis.gaps.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions d'achats */}
          <div>
            <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
              <span>🛍️</span> Pièces recommandées
            </h3>
            <div className="grid gap-4">
              {analysis.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="border border-black/10 dark:border-white/10 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{suggestion.description}</h4>
                      <p className="text-sm text-gray-500">{suggestion.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColors[suggestion.priority]}`}>
                      {priorityLabels[suggestion.priority]}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Pourquoi ?</span> {suggestion.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    {suggestion.estimatedPrice && (
                      <div className="flex items-center gap-2 text-sm text-gold font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {suggestion.estimatedPrice}
                      </div>
                    )}

                    {/* Boutons de recherche */}
                    <div className="flex flex-wrap gap-2 ml-auto">
                      <a
                        href={`https://www.zalando.fr/recherche/?q=${encodeURIComponent(suggestion.searchQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Zalando
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(suggestion.searchQuery + ' achat en ligne')}&tbm=shop`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Google Shopping
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardrobeSuggestions;
