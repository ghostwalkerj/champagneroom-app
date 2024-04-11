/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable unicorn/import-style */
/** @type {import('tailwindcss').Config} */
// @ts-ignore
import { skeleton } from '@skeletonlabs/tw-plugin';
import { join } from 'node:path';
import { myCustomTheme } from './src/neonJesusTheme';

const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    // 3. Append the path to the Skeleton package
    join(
      require.resolve('@skeletonlabs/skeleton'),
      '../**/*.{html,js,svelte,ts}'
    )
  ],
  theme: {
    extend: {
      scale: {
        '-100': '-1'
      },
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)'
      }
    },
    fontFamily: {
      Roboto: ['Roboto', 'sans-serif'],
      SpaceGrotesk: ['Space Grotesk', 'sans-serif'],
      CaviarDreams: ['Caviar Dreams', 'sans-serif']
    },
    screens: {
      '2sx': '300px',
      sx: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px', // LG breakpoint for desktop
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
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    skeleton({
      themes: {
        custom: [myCustomTheme]
      }
    }),

    // @ts-ignore
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value
          })
        },
        { values: theme('textShadow') }
      );
    })
  ]
};
