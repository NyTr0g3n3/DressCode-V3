import React, { useState, useRef, useEffect } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import type { OutfitSuggestion, ClothingItem, ClothingSet, ChatMessage } from '../types';

interface OutfitChatModalProps {
  open: boolean;
  outfit: OutfitSuggestion | null;
  onClose: () => void;
  onSendMessage: (message: string, history: ChatMessage[]) => Promise<void>;
  isGenerating: boolean;
  messages: ChatMessage[];
}

const OutfitChatModal: React.FC<OutfitChatModalProps> = ({
  open,
  outfit,
  onClose,
  onSendMessage,
  isGenerating,
  messages
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  const chatContent = (
    <div className="flex flex-col h-full bg-white dark:bg-raisin-black">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
              <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-bold text-raisin-black dark:text-snow mb-2">Posez-moi une question</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Je peux vous conseiller sur cette tenue, suggérer des alternatives de votre garde-robe, ou répondre à vos questions de style.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
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

  // Version mobile : BottomSheet
  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onDismiss={onClose}
        className={isDarkMode ? 'dark' : ''}
        header={
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-bold text-raisin-black dark:text-snow">💬 Conseils Styliste</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{outfit.titre}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }
        defaultSnap={({ maxHeight }) => maxHeight * 0.7}
        snapPoints={({ minHeight, maxHeight }) => [
          minHeight,
          maxHeight * 0.7,
          maxHeight * 0.95
        ]}
      >
        {chatContent}
      </BottomSheet>
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
