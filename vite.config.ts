import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      'next/link': path.resolve(__dirname, './spa/compat/NextLink.tsx'),
      'next/image': path.resolve(__dirname, './spa/compat/NextImage.tsx'),
      'next/navigation': path.resolve(__dirname, './spa/compat/NextNavigation.ts'),
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://vital-rp.vercel.app',
        changeOrigin: true,
      },
    },
  },
});
