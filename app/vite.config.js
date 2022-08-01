import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';
import basicSsl from '@vitejs/plugin-basic-ssl';

/** @type {import('vite').UserConfig} */
const config = {
	mode: 'development',
	plugins: [sveltekit(), basicSsl(), WindiCSS()],
	build: {
		target: 'esnext',
		minify: false
	}
};

export default config;
