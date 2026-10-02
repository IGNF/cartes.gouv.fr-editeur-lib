import globals from 'globals';
import sonarjs from 'eslint-plugin-sonarjs';
import js from '@eslint/js';

export default [
  {
    ignores: [
      '**/.*',
      '**/www/**',
      '**/todo/**',
      '**/public/**',
      '**/examples/**',
      '**/docs/**'
    ]
  },
  js.configs.recommended,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021
      },
      ecmaVersion: 12,
      sourceType: 'module'
    },
    rules: {
      'sonarjs/no-small-switch': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off'
    }
  }
];