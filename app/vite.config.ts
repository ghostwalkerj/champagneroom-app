import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const config: UserConfig = {
  mode: 'development',
  plugins: [
    sveltekit(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      // exclude: [
      //   'fs', // Excludes the polyfill for `fs` and `node:fs`.
      // ],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),    EnvironmentPlugin(['MONGO_DB_FIELD_SECRET']),

  ],
  build: {
    chunkSizeWarningLimit: 16000,
   
  },
  ssr: {
    //noExternal: ['chart.js/**'],
  },
};

export default config;
