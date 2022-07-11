import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import WindiCSS from 'vite-plugin-windicss';

const config = {

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
		],
		exclude: ['web3']
	}
};

export default config;
