import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import inject from '@rollup/plugin-inject'

const MODE = process.env.NODE_ENV;
const development = MODE === 'development';
const config: UserConfig = {
  mode: 'development',
  plugins: [
    sveltekit(),
    development &&
    nodePolyfills({
      include: ['node_modules/**/*.js', new RegExp('node_modules/.vite/.*js'), 'http', 'crypto']
    }), EnvironmentPlugin(['MONGO_DB_FIELD_SECRET']),

  ],
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      assert: 'assert'
    }
  },
  build: {
    chunkSizeWarningLimit: 16000,
    rollupOptions: {
      external: ['@web3-onboard/*'],
      plugins: [nodePolyfills({ include: ['crypto', 'http'] }), inject({ Buffer: ['Buffer', 'Buffer'] })]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },

  optimizeDeps: {
    exclude: ['@ethersproject/hash', 'wrtc', 'http'],
    include: [
      '@web3-onboard/core',
      'js-sha3',
      '@ethersproject/bignumber'
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      
    }

  },
};

export default config;
