//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
import image from 'svelte-image';
import preprocess from 'svelte-preprocess';

const config = {

	preprocess: preprocess(
		image({
			placeholder: "trace"
		})
	),

	kit: {
		adapter: adapter({
			precompress: true,
		}),

	}
};

export default config;
