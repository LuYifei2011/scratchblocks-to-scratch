import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'dist/', '.git/', 'vite-env.d.ts']
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'no-console': 'warn',
      'no-unused-vars': ['error', { args: 'none' }],
      'no-trailing-spaces': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all']
    }
  }
];
