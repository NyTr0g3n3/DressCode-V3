import React, { useState, useRef, useEffect } from 'react';
import type { OutfitSuggestion, ChatMessage } from '../types';

interface OutfitChatModalProps {
  open: boolean;
  outfit: OutfitSuggestion | null;
  onClose: () => void;
  onSendMessage: (message: string, history: ChatMessage[]) => Promise<void>;
  onApplyReplacement: (itemId: string, itemDescription: string) => void;
  isGenerating: boolean;
  messages: ChatMessage[];
}

const OutfitChatModal: React.FC<OutfitChatModalProps> = ({
  open,
  outfit,
  onClose,
  onSendMessage,
  onApplyReplacement,
  isGenerating,
  messages
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filet de sécurité pour le panneau plein écran mobile : le meta
  // viewport (index.html) demande interactive-widget=resizes-content pour
  // que "100dvh" rétrécisse avec le clavier sur Chrome Android récent,
  // mais cette propriété n'est pas encore supportée par iOS Safari (ni
  // par les navigateurs plus anciens). window.visualViewport, lui, est
  // disponible plus largement et reflète toujours la zone réellement
  // visible. Contrairement à la première tentative (qui pilotait une
  // BottomSheet animée avec deux mécanismes concurrents — maxHeight +
  // offset CSS séparé), il n'y a ici qu'un seul état simple appliqué en
  // style inline sur un div fixe classique : pas de machine à états
  // tierce avec laquelle se désynchroniser.
  const [viewportBox, setViewportBox] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => setViewportBox({ height: viewport.height, top: viewport.offsetTop });
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setInputValue('');

    try {
      await onSendMessage(inputValue.trim(), [...messages, userMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!outfit) return null;

  // Contenu réutilisable
  // flex-1 min-h-0 (au lieu de h-full) sur les deux niveaux : en flexbox,
  // un enfant sans min-h-0 explicite refuse de rétrécir sous la taille de
  // son contenu (min-height:auto par défaut), donc quand la conversation
  // devient plus haute que l'espace disponible, la zone de messages —
  // censée défiler en interne — poussait plutôt tout le panneau à grandir,
  // faisant sortir la barre de saisie de l'écran. min-h-0 force le
  // rétrécissement au conteneur disponible pour que overflow-y-auto
  // fasse défiler les messages sans jamais déplacer la barre de saisie.
  const chatContent = (
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-raisin-black">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
              <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-bold text-raisin-black dark:text-snow mb-2">Posez-moi une question</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Je peux vous conseiller sur cette tenue, suggérer des alternatives de votre garde-robe, ou répondre à vos questions de style. Demandez-moi de remplacer une pièce précise et je vous proposerai de le faire directement.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-gold text-raisin-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-raisin-black dark:text-snow'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'assistant' && message.suggestedReplacement && (
              <button
                onClick={() => onApplyReplacement(message.suggestedReplacement!.itemId, message.suggestedReplacement!.itemDescription)}
                className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold-dark dark:text-gold rounded-full text-xs font-semibold transition-colors active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Remplacer « {message.suggestedReplacement.itemDescription} »
              </button>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Réflexion en cours...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Posez votre question..."
            disabled={isGenerating}
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-raisin-black dark:text-snow focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="px-6 py-2 bg-gold text-raisin-black rounded-full font-medium hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );

  // Version mobile : panneau plein écran (pas de BottomSheet), dimensionné
  // en priorité par viewportBox (window.visualViewport, cf. plus haut) —
  // toujours la zone réellement visible, clavier ouvert ou non — avec
  // "h-[100dvh]" comme hauteur de secours pour le tout premier rendu,
  // avant que l'effect ait mesuré le viewport visuel.
  if (isMobile) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-white dark:bg-raisin-black h-[100dvh] transition-transform duration-200 ${
          open ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          ...(viewportBox ? { top: viewportBox.top, height: viewportBox.height } : {})
        }}
      >
        <div
          className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 pb-4"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div>
            <h2 className="text-xl font-bold text-raisin-black dark:text-snow">💬 Conseils Styliste</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{outfit.titre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {chatContent}
      </div>
    );
  }

  // Version desktop : Modale classique (taille similaire à OutfitModal)
  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white dark:bg-raisin-black rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col transition-all duration-200 ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header desktop */}
        <div className="sticky top-0 bg-white dark:bg-raisin-black border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-raisin-black dark:text-snow">💬 Conseils Styliste</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{outfit.titre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {chatContent}
      </div>
    </div>
  );
};

export default OutfitChatModal;
