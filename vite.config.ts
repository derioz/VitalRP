import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Configured for custom domain (vitalrp.net) which uses root path
  build: {
    outDir: 'docs', // Output to docs folder as requested for GitHub Pages
    emptyOutDir: true,
  },
});