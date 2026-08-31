import React from 'react';
import type { MobileTab } from '../types';
import { TshirtIcon, PantIcon, ShoeIcon, AccessoryIcon } from './icons.tsx';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  counts: {
    hauts: number;
    bas: number;
    chaussures: number;
    accessoires: number;
  };
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    {
      id: 'home' as MobileTab,
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      count: null
    },
    {
      id: 'hauts' as MobileTab,
      label: 'Hauts',
      icon: <TshirtIcon />,
      count: counts.hauts
    },
    {
      id: 'bas' as MobileTab,
      label: 'Bas',
      icon: <PantIcon />,
      count: counts.bas
    },
    {
      id: 'chaussures' as MobileTab,
      label: 'Chaussures',
      icon: <ShoeIcon />,
      count: counts.chaussures
    },
    {
      id: 'accessoires' as MobileTab,
      label: 'Accessoires',
      icon: <AccessoryIcon />,
      count: counts.accessoires
    }
  ];

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-raisin-black border-t border-black/10 dark:border-white/10 z-30 pb-8">
      {/* Indicateur qui glisse jusqu'à l'onglet actif au lieu d'un simple changement de couleur */}
      <div
        className="absolute top-0 h-0.5 bg-gold rounded-full transition-transform duration-300 ease-out"
        style={{ width: `${100 / tabs.length}%`, transform: `translateX(${activeIndex * 100}%)` }}
      />
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all active:scale-90 flex-1 ${
                isActive ? 'text-gold' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-raisin-black ${
                    isActive
                      ? 'bg-gold text-onyx'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
