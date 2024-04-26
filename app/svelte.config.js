//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  onwarn: (
    /** @type {{ code: string; }} */ warning,
    /** @type {(arg0: any) => void} */ handler
  ) => {
    // suppress warnings on `vite dev` and `vite build`; but even without this, things still work
    if (warning.code === 'a11y-click-events-have-key-events') return;
    if (warning.code === 'a11y-no-static-element-interactions') return;
    if (warning.code === 'a11y-no-noninteractive-element-interactions') return;
    // if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    // if(warning.code === 'THIS_IS_UNDEFINED') return;

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
  },
  preprocess: [
    preprocess({
      postcss: true
    })
  ]
};

export default config;
