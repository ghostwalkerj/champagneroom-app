import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';
import basicSsl from '@vitejs/plugin-basic-ssl';

const config = {
	mode: 'development',
	plugins: [sveltekit(), basicSsl(), WindiCSS()],
	//plugins: [sveltekit(), WindiCSS()],
	optimizeDeps: {

		exclude: ['path', 'fs', 'os', 'perf_hooks'],
	}
};

export default config;
