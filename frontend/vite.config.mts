import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import vitePortScanner from './vite-plugin-port-scanner';

// https://vite.dev/config/
export default defineConfig({
  base: '/OpenAerialMap/',
  server: {
    port: 9000
  },
  plugins: [react(), vitePortScanner()],
  resolve: {
    alias: {
      '$components': path.resolve(__dirname, './app/components'),
      '$utils': path.resolve(__dirname, './app/utils'),
      '$styles': path.resolve(__dirname, './app/styles'),
      '$hooks': path.resolve(__dirname, './app/hooks'),
      '$pages': path.resolve(__dirname, './app/pages')
    }
  }
});
