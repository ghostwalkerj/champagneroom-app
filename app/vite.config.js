import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';

/** @type {import('vite').UserConfig} */
const config = {
	mode: 'development',
	plugins: [sveltekit(), WindiCSS()],
	optimizeDeps: {
	},
	ssr: {
		noExternal: ['chart.js/**']
	}
};

export default config;
