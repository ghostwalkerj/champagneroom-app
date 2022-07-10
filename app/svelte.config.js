import adapter from '@sveltejs/adapter-auto';
import image from 'svelte-image';
import preprocess from 'svelte-preprocess';

const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(
		image({
			placeholder: "trace"
		})
	),

	kit: {
		adapter: adapter(),
		moduleExtensions: ['.ts'],
		paths: {
			base: ''
		},
		// adapter: adapter({
		// 	fallback: '200.html'
		// }),
		// prerender: {
		// 	enabled: false
		// },

	}
};

export default config;
