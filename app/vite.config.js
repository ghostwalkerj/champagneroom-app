import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';
import path from 'path';

const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	server: {
		hmr: { overlay: true },
		cors: {
			origin: "*",
			methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
		},
	},
	resolve: {
		alias: {
			// these are the aliases and paths to them
			components: path.resolve('./src/components'),
			lib: path.resolve('./src/lib'),
			db: path.resolve('./src/db')
		}
	},
	mode: 'development',
	plugins: [sveltekit(), WindiCSS()],
	optimizeDeps: {
		include: ['gun',
			'gun/gun',
			'gun/sea',
			'gun/sea.js',
			'gun/lib/then',
			'gun/lib/webrtc',
			'gun/lib/radix',
			'gun/lib/radisk',
			'gun/lib/store',
			'gun/lib/rindexed',
			'gun/lib/unset.js',
			'gun/lib/not.js'
		]
	}
};

export default config;
