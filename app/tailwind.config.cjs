/** @type {import('tailwindcss').Config} */
// @ts-ignore

const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      scale: {
        "-100": "-1",
      },
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
      },
    },
    fontFamily: {
      'SpaceGrotesk': ['Space Grotesk', 'sans-serif'],
      'Roboto': ['Roboto', 'sans-serif'],
      'CaviarDreams': ['Caviar Dreams', 'sans-serif'],
    },
    screens: {
      "2sx": "300px",
      sx: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px", // LG breakpoint for desktop
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "2000px",
      "4xl": "2500px",
      "5xl": "3000px",
      "6xl": "3500px",
      "7xl": "4000px",
      "8xl": "4500px",
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),

    // @ts-ignore
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      );
    }),
  ],
  daisyui: {
    styled: true,
    base: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: 'daisy-',
    themes: [
      {
        cryptoJesus: {
          "primary": "#FF66CC",
          "secondary": "#00FFFF",     // Baby Blue
          "accent": "#FFFF00",        // Yellow
          "neutral": "#A9CCE3",       // Dark Blue (You can change this to another color if you prefer)
          "base-100": "#1a1a1a",      // Dark Base
          "info": "#00FFFF",          // Baby Blue (same as secondary)
          "success": "#53c0f3",       // A shade of blue
          "warning": "#F06400",       // Orange
          "error": "#E24056",

        },
      },
    ],
  },
};
