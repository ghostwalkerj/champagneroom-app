//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
//import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    csrf: { checkOrigin: false },
    alias: {
      $components: './src/components',
      $lib: './src/lib',
      $queues: './src/routes/api/v1/queues',
    },
  },
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
};

export default config;
