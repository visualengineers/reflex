const js = require('@eslint/js');
const globals = require('globals');
const template = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');
const vue = require('eslint-plugin-vue');
const typescriptConfig = require('./scripts/eslint/typescript.config.cjs');
const reactRequire = require('node:module').createRequire(require('node:path').resolve(__dirname, 'examples/basic-react/package.json'));
const workspaces = require('./package.json').workspaces;

const angularProjects = new Set([
  'packages/reflex-angular-components', 'tools/ReFlex.TrackingServer/ClientApp',
  'tools/emulator', 'tools/gestenrecorder', 'examples/basic-angular',
  'examples/shared-components-demo'
]);

module.exports = [
  {
    name: 'reflex/generated-files',
    ignores: [
      '**/node_modules/**', '**/.angular/**', '**/dist/**', '**/out-tsc/**',
      '**/obj/**', '**/bin/**', '**/artifacts/**', '**/documentation/**',
      'test/artifacts/**'
    ]
  },
  {
    name: 'reflex/lint-directives',
    linterOptions: { reportUnusedDisableDirectives: 'error' }
  },
  {
    name: 'reflex/javascript',
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { globals: { ...globals.es2022, ...globals.browser, ...globals.node } },
    rules: js.configs.recommended.rules
  },
  ...typescriptConfig('test/helpers', false),
  ...workspaces.filter(project => !project.includes('basic-react') && !project.includes('basic-vue'))
    .flatMap(project => typescriptConfig(project, angularProjects.has(project))),
  {
    name: 'reflex/angular-templates',
    files: [...angularProjects].map(project => `${project}/**/*.html`),
    languageOptions: { parser: templateParser },
    plugins: { '@angular-eslint/template': template },
    rules: {
      ...template.configs.recommended.rules,
      ...template.configs.accessibility.rules
    }
  },
  ...vue.configs['flat/recommended'].map(config => ({
    ...config, files: ['examples/basic-vue/**/*.vue']
  })),
  {
    name: 'reflex/vue-javascript',
    files: ['examples/basic-vue/**/*.{js,vue}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: js.configs.recommended.rules
  },
  {
    name: 'reflex/react',
    files: ['examples/basic-react/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.es2022, ...globals.browser }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'react-hooks': reactRequire('eslint-plugin-react-hooks'),
      'react-refresh': reactRequire('eslint-plugin-react-refresh')
    },
    rules: {
      ...js.configs.recommended.rules,
      ...require('@typescript-eslint/eslint-plugin').configs['eslint-recommended'].overrides[0].rules,
      ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
      ...reactRequire('eslint-plugin-react-hooks').configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  }
];
