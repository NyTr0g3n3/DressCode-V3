import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/DressCode-V3/',
  plugins: [react()],
  define: {
    __GEMINI_API_KEY__: JSON.stringify(process.env.VITE_GEMINI_API_KEY || '')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
