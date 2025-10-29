import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    proxy: {
      // Proxy toutes les requêtes /api vers le backend local
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        // rewrite: path => path.replace(/^\/api/, '/api') // pas nécessaire ici
      }
    }
  }
});