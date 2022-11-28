
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			scale: {
				'-100': '-1',
			}
		},
		screens: {
			'2sx': '300px',
			sx: '400px',
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px',
			'3xl': '2000px',
			'4xl': '2500px',
			'5xl': '3000px',
			'6xl': '3500px',
			'7xl': '4000px',
			'8xl': '4500px'
		}
	},
	plugins: [require("daisyui"), require('tailwindcss-font-inter'), require('@tailwindcss/typography')],
	daisyui: {
		styled: true,
		base: true,
		utils: true,
		logs: false,
		rtl: false,
		themes: [
			{
				cryptoJesus: {
					...require('daisyui/src/colors/themes')['[data-theme=synthwave]'],
					fontFamily: 'Inter',
					'base-100': '#150050',
					'base-200': '#20134e',
					'base-300': '#140a2e',
					'base-content': '#f9f7fd',
					'--border-color': 'var(--b3)',
					'--rounded-box': '1rem',
					'--rounded-btn': '0.5rem',
					'--rounded-badge': '1.9rem',
					'--animation-btn': '0.25s',
					'--animation-input': '.2s',
					'--btn-text-case': 'uppercase',
					'--btn-focus-scale': '0.95',
					'--navbar-padding': '.5rem',
					'--border-btn': '1px',
					'--tab-border': '1px',
					'--tab-radius': '0.5rem'
				}
			}
		]
	}
};
