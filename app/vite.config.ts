import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type UserConfig } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import mkcert from 'vite-plugin-mkcert';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import type { InlineConfig } from 'vitest';

type ViteConfig = UserConfig & { test: InlineConfig };
const config: ViteConfig = {
  // other config
  test: {
      globals: true,
      include: ['tests/unit/*.{test,spec}.ts'],
      setupFiles: ['./setup/setupTests.ts', './setup/mongoMemoryServer.ts']
    },
  mode: 'development',

  define: {
    SUPERFORMS_LEGACY: true
  },

  plugins: [
    sveltekit(),
    mkcert(),
    EnvironmentPlugin(['MONGO_DB_FIELD_SECRET']),
    nodePolyfills({
      include: ['path', 'stream', 'util'],
      exclude: ['http'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      overrides: {
        fs: 'memfs',
      },
      protocolImports: true,
    }),
  ],

  resolve: {
    alias:{
            process: "process/browser",
            stream: "stream-browserify",
            assert: "assert",
            http: "stream-http",
            https: "https-browserify",
            os: "os-browserify",
            url: "url",
            vm: 'vm-browserify'
        },
  },
  build: {
    chunkSizeWarningLimit: 16000,
    rollupOptions: {
      external: ['@web3-onboard/*', 'mongoose-zod', 'crypto']
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    minify: true,
    sourcemap: false,
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['@ethersproject/hash', 'wrtc'],
    include: ['@web3-onboard/core', 'js-sha3', '@ethersproject/bignumber'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },

};
export default defineConfig(config);
