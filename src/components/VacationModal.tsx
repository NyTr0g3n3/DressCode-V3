import React from 'react';
import VacationPlanner from './VacationPlanner';
import VacationResultDisplay from './VacationResultDisplay';
import type { ClothingItem, ClothingSet, VacationPlan } from '../types';

interface VacationModalProps {
  clothingItems: ClothingItem[];
  clothingSets: ClothingSet[];
  onGeneratePlan: (days: number, context: string) => void;
  isGenerating: boolean;
  vacationPlan: VacationPlan | null;
  onCreateSet: (name: string, itemIds: string[]) => void;
  onClose: () => void;
}

const VacationModal: React.FC<VacationModalProps> = ({ 
  clothingItems,
  clothingSets,
  onGeneratePlan, 
  isGenerating,
  vacationPlan,
  onCreateSet,
  onClose 
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:hidden"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-raisin-black w-full max-h-[85vh] rounded-t-3xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec handle bar */}
        <div className="sticky top-0 bg-white dark:bg-raisin-black border-b border-black/10 dark:border-white/10 p-4 pb-3">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3"></div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🧳 Planificateur de Valise</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6 space-y-6">
          <VacationPlanner 
            clothingItems={clothingItems}
            clothingSets={clothingSets}
            onGeneratePlan={onGeneratePlan}
            isGenerating={isGenerating}
          />

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="animate-spin h-10 w-10 text-gold" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">Préparation de votre valise...</p>
            </div>
          )}

          {vacationPlan && (
  <VacationResultDisplay 
    plan={vacationPlan} 
    allClothingItems={clothingItems}
    allClothingSets={clothingSets} // ✅ AJOUTÉ
    onCreateSet={onCreateSet}
  />
)}
        </div>
      </div>
    </div>
  );
};

export default VacationModal;
