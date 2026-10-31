import js from '@eslint/js';
import globals from 'globals';
import parser from '@typescript-eslint/parser';
import typescript from '@typescript-eslint/eslint-plugin';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.*'] },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': hooks,
      'react-refresh': refresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...typescript.configs['eslint-recommended'].overrides[0].rules,
      ...typescript.configs.recommended.rules
    }
  }
];
