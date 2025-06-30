// ./vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add polyfills for node builtins.
      protocolImports: true,
    }),
  ],
  define: {
    // This is needed to support some libraries that rely on `global`.
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
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
