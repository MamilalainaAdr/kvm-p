import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        // IMPORTANT : configure pour transmettre les cookies
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const cookie = req.headers.cookie;
            if (cookie) {
              proxyReq.setHeader('cookie', cookie);
            }
          });
        }
      }
    }
  }
});