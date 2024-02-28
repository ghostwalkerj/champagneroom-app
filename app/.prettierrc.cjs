/** @type {import("prettier").Config} */
module.exports = {
  "tabWidth": 2,
  "semi": true,
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }],
  "singleQuote": true,
  "trailingComma": 'none',
  plugins: [
    import('prettier-plugin-svelte'),
    import('prettier-plugin-tailwindcss')
  ]
};