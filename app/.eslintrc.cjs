module.exports = {
  // ...
  extends: [
    'plugin:svelte/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    extraFileExtensions: ['.svelte'], // This is a required setting in `@typescript-eslint/parser` v4.24.0.
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'svelte/no-unused-svelte-ignore': 'off',
    '@typescript-eslint/no-explicit-any': 'off',    
    'quotes': [2, 'single', { 'avoidEscape': true }],
    'semi': [2, 'always'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'separate-type-imports',
      },
    ],
  },
}
