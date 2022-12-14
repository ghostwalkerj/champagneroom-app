
import path from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www',);
const CONSTANTS = path.resolve(__dirname, './src/lib/constants');
const LIB_DIR = path.resolve(__dirname, './node_modules/pcall/src/lib/');

export default defineConfig({
  plugins: [
    svelte(),
  ],
  root: SRC_DIR,
  publicDir: PUBLIC_DIR,
  build: {
    outDir: BUILD_DIR,
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: {
      treeshake: false,
    },
  },
  resolve: {
    alias: {

      '@': path.resolve(__dirname, './src'),
      '$env/static/public': CONSTANTS,
      '$lib': LIB_DIR,
      'lib': path.resolve(__dirname, './src/lib'),
      'ts': path.resolve(__dirname, './src/ts'),
      'pages': path.resolve(__dirname, './src/pages'),
    },
  },
  server: {
    host: true,
    port: 5174
  },
  define: {
    global: 'globalThis'
  }

});
