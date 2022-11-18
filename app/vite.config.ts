import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	mode: 'development',
	plugins: [sveltekit()],
	optimizeDeps: {},
	ssr: {
		noExternal: ['chart.js/**']
	}
};

export default config;
