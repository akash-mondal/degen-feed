// ./vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    // THIS IS THE CRITICAL PART
    host: '0.0.0.0', // Listen on all network interfaces

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
