import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/twitter-api': {
        target: 'https://api.twitterapi.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/twitter-api/, ''),
        secure: true
      },
      '/ai-api': {
        target: 'https://api.together.xyz/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-api/, ''),
        secure: true
      },
      '/telegram-api': {
        target: 'https://tele-extract.fly.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/telegram-api/, ''),
        secure: true
      }
    }
  }
});