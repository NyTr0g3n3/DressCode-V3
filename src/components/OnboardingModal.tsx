import React, { useState } from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
}

const steps = [
  {
    emoji: '👋',
    title: 'Bienvenue dans Dress Me Up!',
    description: 'Votre assistant mode personnel propulsé par l\'IA. Découvrons ensemble comment ça marche.'
  },
  {
    emoji: '📸',
    title: 'Ajoutez vos vêtements',
    description: 'Prenez en photo vos vêtements. L\'IA analysera automatiquement la couleur, la matière et le type.'
  },
  {
    emoji: '✨',
    title: 'Générez des tenues',
    description: 'Décrivez une occasion et l\'IA créera des combinaisons parfaites à partir de votre garde-robe.'
  },
  {
    emoji: '🧳',
    title: 'Planifiez vos valises',
    description: 'Partez en voyage ? L\'IA optimise votre valise selon la durée et la destination.'
  }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('dressmup_onboarding_complete', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('dressmup_onboarding_complete', 'true');
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-onyx/90 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-white dark:bg-raisin-black rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 text-center">
          <div className="text-6xl mb-6">{step.emoji}</div>
          <h2 className="text-2xl font-serif font-bold mb-4">{step.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{step.description}</p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-gold w-6' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Passer
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gold text-onyx font-bold rounded-xl hover:bg-gold-dark transition-all"
            >
              {currentStep < steps.length - 1 ? 'Suivant' : 'Commencer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
