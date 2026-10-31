const js = require('@eslint/js');
const globals = require('globals');
const parser = require('@typescript-eslint/parser');
const typescript = require('@typescript-eslint/eslint-plugin');
const angular = require('@angular-eslint/eslint-plugin');
const template = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');

module.exports = [
  {
    ignores: ['**/node_modules/**', '**/.angular/**', '**/dist/**', '**/projects/**']
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parser, globals: globals.browser },
    plugins: { '@typescript-eslint': typescript, '@angular-eslint': angular },
    processor: template.processors['extract-inline-html'],
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs['eslint-recommended'].overrides[0].rules,
      ...typescript.configs.recommended.rules,
      ...angular.configs.recommended.rules,
      '@angular-eslint/directive-selector': ['error', {
        type: 'attribute', prefix: 'app', style: 'camelCase'
      }],
      '@angular-eslint/component-selector': ['error', {
        type: 'element', prefix: 'app', style: 'kebab-case'
      }]
    }
  },
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { '@angular-eslint/template': template },
    rules: {
      ...template.configs.recommended.rules,
      ...template.configs.accessibility.rules,
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn'
    }
  }
];
