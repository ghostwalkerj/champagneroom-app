import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

const config: UserConfig = {
  mode: 'development',
  plugins: [sveltekit()],
  ssr: {
    noExternal: ['chart.js/**', 'quirrel/**'],
  },
};

export default config;
