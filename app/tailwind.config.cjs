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
          "secondary": "#07FFFF",
          "accent": "#f3cc30",
          "neutral": "#2A0134",
          "base-100": "#000000",
          "info": "#07FFFF",
          "success": "#53c0f3",
          "warning": "#F06400",
          "error": "#E24056",
        },
      },
    ],
  },
};
