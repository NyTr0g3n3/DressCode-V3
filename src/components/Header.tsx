import React from 'react';
import { SunIcon, MoonIcon } from './icons.tsx';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  children?: React.ReactNode;
  isModalOpen?: boolean;
}
const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, children, isModalOpen = false }) => {
  return (
    <header className={`bg-snow/80 dark:bg-onyx/80 backdrop-blur-lg border-b border-black/5 dark:border-white/10 sticky top-0 transition-all ${isModalOpen ? 'z-10' : 'z-50'}`}>
      <div className="container mx-auto px-4 lg:px-8 h-24 flex justify-between items-center">
        <h1 className="text-4xl font-serif font-bold tracking-wider text-raisin-black dark:text-snow">
          Dress <span className="text-gold">Me</span> Up!
        </h1>
        <div className="flex items-center gap-4">
          {children}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold dark:focus:ring-offset-onyx transition-colors"
            aria-label="Changer le thème"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
