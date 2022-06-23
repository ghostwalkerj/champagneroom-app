import adapter from '@sveltejs/adapter-auto';
import path from 'path';
import image from 'svelte-image';
import preprocess from 'svelte-preprocess';
import WindiCSS from 'vite-plugin-windicss';

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
		endpointExtensions: ['.ts'],
		paths: {
			base: ''
		},
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
					components: path.resolve('./src/components'),
					lib: path.resolve('./src/lib'),
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
