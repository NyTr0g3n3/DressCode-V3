import React from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import type { ClothingItem } from '../types';
import LaundryBinList from './LaundryBinList';

interface LaundryBinModalProps {
  open: boolean;
  onClose: () => void;
  dirtyItems: ClothingItem[];
  onMarkClean: (item: ClothingItem) => void;
}

const LaundryBinModal: React.FC<LaundryBinModalProps> = ({ open, onClose, dirtyItems, onMarkClean }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      className={isDarkMode ? 'dark' : ''}
      header={
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-raisin-black dark:text-snow">🧺 Bac à Linge</h2>
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
      defaultSnap={({ maxHeight }) => maxHeight * 0.65}
      snapPoints={({ maxHeight }) => [
        maxHeight * 0.65,
        maxHeight * 0.85
      ]}
    >
      <div className="p-6 bg-white dark:bg-raisin-black text-raisin-black dark:text-snow">
        <LaundryBinList dirtyItems={dirtyItems} onMarkClean={onMarkClean} />
      </div>
    </BottomSheet>
  );
};

export default LaundryBinModal;
