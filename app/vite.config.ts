import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  mode: 'development',

  plugins: [
    nodePolyfills({
      protocolImports: true
    }),
    sveltekit(),
    mkcert(),
    EnvironmentPlugin(['MONGO_DB_FIELD_SECRET'])
  ],

  resolve: {
    alias: {}
  },
  build: {
    chunkSizeWarningLimit: 16000,
    rollupOptions: {
      external: ['@web3-onboard/*', 'mongoose-zod']
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['@ethersproject/hash', 'wrtc', 'http'],
    include: ['@web3-onboard/core', 'js-sha3', '@ethersproject/bignumber'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  test: {
    // Jest like globals
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/*.{test,spec}.ts'],
    // Extend jest-dom matchers
    setupFiles: ['./setupTests.js']
  }
});
