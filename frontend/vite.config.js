import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/socket.io': {  // ✅ Proxy spécifique pour Socket.io
        target: process.env.API_URL,
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
});