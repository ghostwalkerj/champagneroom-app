/** @type {import('tailwindcss').Config} */
// @ts-ignore

module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      scale: {
        "-100": "-1",
      },
    },
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
    },
  },
  plugins: [
    require("daisyui"),
    require("@tailwindcss/typography"),
  ],
  daisyui: {
    styled: true,
    base: true,
    utils: true,
    logs: false,
    rtl: false,
    themes: [
      {
        cryptoJesus: {

          "primary": "#e779c1",
          "secondary": "#00FFFF",     // Baby Blue
          "accent": "#FFD500",        // Yellow
          "neutral": "#5C6BC0",       // Dark Blue (You can change this to another color if you prefer)
          "base-100": "#1a1a1a",      // Dark Base
          "info": "#00FFFF",          // Baby Blue (same as secondary)
          "success": "#53c0f3",       // A shade of blue
          "warning": "#F06400",       // Orange
          "error": "#E24056"
        },
      },
    ],
  },
};
