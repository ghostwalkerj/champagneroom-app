import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const myCustomTheme: CustomThemeConfig = {
  name: 'my-custom-theme',
  properties: {
    // =~= Theme Properties =~=
    '--theme-font-family-base':
      "Caviar Dreams, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    '--theme-font-family-heading':
      "Caviar Dreams, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    '--theme-font-color-base': '0 0 0',
    '--theme-font-color-dark': '255 255 255',
    '--theme-rounded-base': '4px',
    '--theme-rounded-container': '4px',
    '--theme-border-base': '1px',
    // =~= Theme On-X Colors =~=
    '--on-primary': '0 0 0',
    '--on-secondary': '0 0 0',
    '--on-tertiary': '0 0 0',
    '--on-success': '0 0 0',
    '--on-warning': '0 0 0',
    '--on-error': '255 255 255',
    '--on-surface': '255 255 255',
    // =~= Theme Colors  =~=
    // primary | #EC31ED
    '--color-primary-50': '252 224 252', // #fce0fc
    '--color-primary-100': '251 214 251', // #fbd6fb
    '--color-primary-200': '250 204 251', // #faccfb
    '--color-primary-300': '247 173 248', // #f7adf8
    '--color-primary-400': '242 111 242', // #f26ff2
    '--color-primary-500': '236 49 237', // #EC31ED
    '--color-primary-600': '212 44 213', // #d42cd5
    '--color-primary-700': '177 37 178', // #b125b2
    '--color-primary-800': '142 29 142', // #8e1d8e
    '--color-primary-900': '116 24 116', // #741874
    // secondary | #00FFFF
    '--color-secondary-50': '217 255 255', // #d9ffff
    '--color-secondary-100': '204 255 255', // #ccffff
    '--color-secondary-200': '191 255 255', // #bfffff
    '--color-secondary-300': '153 255 255', // #99ffff
    '--color-secondary-400': '77 255 255', // #4dffff
    '--color-secondary-500': '0 255 255', // #00FFFF
    '--color-secondary-600': '0 230 230', // #00e6e6
    '--color-secondary-700': '0 191 191', // #00bfbf
    '--color-secondary-800': '0 153 153', // #009999
    '--color-secondary-900': '0 125 125', // #007d7d
    // tertiary | #FFD800
    '--color-tertiary-50': '255 239 153', // Lighter shade
    '--color-tertiary-100': '255 236 128', // Slightly lighter
    '--color-tertiary-200': '255 233 102', // Closer to base
    '--color-tertiary-300': '255 230 77', // A bit darker
    '--color-tertiary-400': '255 227 51', // Even darker
    '--color-tertiary-500': '255 204 0', // Base Cyberpunk 2077 yellow
    '--color-tertiary-600': '229 183 0', // Darker variant
    '--color-tertiary-700': '204 163 0', // Even more dark
    '--color-tertiary-800': '179 143 0', // Darker
    '--color-tertiary-900': '154 123 0', // Darkest shade
    // success | #84cc16
    '--color-success-50': '237 247 220', // #edf7dc
    '--color-success-100': '230 245 208', // #e6f5d0
    '--color-success-200': '224 242 197', // #e0f2c5
    '--color-success-300': '206 235 162', // #ceeba2
    '--color-success-400': '169 219 92', // #a9db5c
    '--color-success-500': '132 204 22', // #84cc16
    '--color-success-600': '119 184 20', // #77b814
    '--color-success-700': '99 153 17', // #639911
    '--color-success-800': '79 122 13', // #4f7a0d
    '--color-success-900': '65 100 11', // #41640b
    // warning | #EAB308
    '--color-warning-50': '252 244 218', // #fcf4da
    '--color-warning-100': '251 240 206', // #fbf0ce
    '--color-warning-200': '250 236 193', // #faecc1
    '--color-warning-300': '247 225 156', // #f7e19c
    '--color-warning-400': '240 202 82', // #f0ca52
    '--color-warning-500': '234 179 8', // #EAB308
    '--color-warning-600': '211 161 7', // #d3a107
    '--color-warning-700': '176 134 6', // #b08606
    '--color-warning-800': '140 107 5', // #8c6b05
    '--color-warning-900': '115 88 4', // #735804
    // error | #D41976
    '--color-error-50': '249 221 234', // #f9ddea
    '--color-error-100': '246 209 228', // #f6d1e4
    '--color-error-200': '244 198 221', // #f4c6dd
    '--color-error-300': '238 163 200', // #eea3c8
    '--color-error-400': '225 94 159', // #e15e9f
    '--color-error-500': '212 25 118', // #D41976
    '--color-error-600': '191 23 106', // #bf176a
    '--color-error-700': '159 19 89', // #9f1359
    '--color-error-800': '127 15 71', // #7f0f47
    '--color-error-900': '104 12 58', // #680c3a
    // surface | #495a8f
    '--color-surface-50': '228 230 238', // #e4e6ee
    '--color-surface-100': '219 222 233', // #dbdee9
    '--color-surface-200': '210 214 227', // #d2d6e3
    '--color-surface-300': '182 189 210', // #b6bdd2
    '--color-surface-400': '128 140 177', // #808cb1
    '--color-surface-500': '73 90 143', // #495a8f
    '--color-surface-600': '66 81 129', // #425181
    '--color-surface-700': '55 68 107', // #37446b
    '--color-surface-800': '44 54 86', // #2c3656
    '--color-surface-900': '36 44 70' // #242c46
  }
};
