import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg aspect-square relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
  </div>
);
