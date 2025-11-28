import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/socket.io': {  // ✅ Proxy spécifique pour Socket.io
        target: process.env.VITE_API_URL,
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
});