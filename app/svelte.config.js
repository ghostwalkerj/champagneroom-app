import adapter from '@sveltejs/adapter-auto';
import path from 'path';
import preprocess from 'svelte-preprocess';
import WindiCSS from 'vite-plugin-windicss';
import image from 'svelte-image';

const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(
		image({
			placeholder: "blur"
		})
	),

	kit: {
		adapter: adapter(),
		// adapter: adapter({
		// 	fallback: '200.html'
		// }),
		// prerender: {
		// 	enabled: false
		// },
		vite: {
			server: { hmr: { overlay: true } },
			resolve: {
				alias: {
					// these are the aliases and paths to them
					types: path.resolve('./src/types'),
					components: path.resolve('./src/components'),
					stores: path.resolve('./src/stores'),
					lib: path.resolve('./src/lib'),
					models: path.resolve('./src/models'),
					db: path.resolve('./src/db')
				}
			},
			mode: 'development',

			plugins: [WindiCSS()]
			,
			optimizeDeps: {
				esbuildOptions: {
					// Node.js global to browser globalThis
					define: {
						global: "globalThis",
					},

				}
			}
		}
	}
};

export default config;
