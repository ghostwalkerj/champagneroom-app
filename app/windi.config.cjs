module.exports = {

	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
		screens: {
			"2sx": "300px",
			sx: "400px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1536px",
			"3xl": "2000px",
			"4xl": "2500px",
			"5xl": "3000px",
			"6xl": "3500px",
			"7xl": "4000px",
			"8xl": "4500px",

		}
	},
	plugins: [require("daisyui"), require("tailwindcss-font-inter")],
	daisyui: {
		styled: true,
		base: true,
		utils: true,
		logs: false,
		rtl: false,
		themes: [
			{
				cyptoJesus: {
					fontFamily: "Inter",
					primary: "#e779c1",
					"primary-focus": "#e04dac",
					"primary-content": "#201047",
					"secondary-focus": "#88d7f7",
					secondary: "#58c7f3",
					"secondary-content": "#201047",
					"accent-focus": "#f6d860",
					accent: "#f3cc30",
					"accent-content": "#201047",
					neutral: "#20134e",
					"neutral-focus": "#140a2e",
					"neutral-content": "#f9f7fd",
					"base-100": "#150050",
					"base-200": "#20134e",
					"base-300": "#140a2e",
					"base-content": "#f9f7fd",
					info: "#53c0f3",
					success: "#71ead2",
					warning: "#f3cc30",
					error: "#e24056",
					"--border-color": "var(--b3)",
					"--rounded-box": "1rem",
					"--rounded-btn": "0.5rem",
					"--rounded-badge": "1.9rem",
					"--animation-btn": "0.25s",
					"--animation-input": ".2s",
					"--btn-text-case": "uppercase",
					"--btn-focus-scale": "0.95",
					"--navbar-padding": ".5rem",
					"--border-btn": "1px",
					"--tab-border": "1px",
					"--tab-radius": "0.5rem"
				}
			}
		]
	}
};
