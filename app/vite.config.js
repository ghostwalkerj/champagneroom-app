import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';
import basicSsl from '@vitejs/plugin-basic-ssl';

const config = {

	resolve: {
		alias: {
			// these are the aliases and paths to them
			//$lib: path.resolve('./src/lib'),
		}
	},
	mode: 'development',
	plugins: [sveltekit(), basicSsl(), WindiCSS()],
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
			'gun/lib/not.js'],
		exclude: ['path', 'fs', 'os', 'perf_hooks'],
	}
};

export default config;
