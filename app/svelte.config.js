//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  onwarn: (warning, handler) => {
    if (warning.code.startsWith('a11y-')) return;
    if (warning.code === 'missing-exports-condition') return;
    if (warning.code === 'a11y-no-static-element-interactions') return;
    if (warning.code === 'svelte-ignore a11y-autofocus') return;
    if (warning.code.startsWith('css-unused-selector')) return;
    handler(warning);
  },
  kit: {
    adapter: adapter(),
    csrf: { checkOrigin: true },
    alias: {
      $components: './src/components',
      $lib: './src/lib',
      $stores: './src/stores',
      $util: './src/util',
      $ext: './src/lib/ext',
      $server: './src/lib/server'
    }
  }
};

export default config;
