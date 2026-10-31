const js = require('@eslint/js');
const globals = require('globals');
const parser = require('@typescript-eslint/parser');
const typescript = require('@typescript-eslint/eslint-plugin');
const stylistic = require('@stylistic/eslint-plugin-ts');

// Reuse the shared policy as rule data, without loading its legacy parser/plugins.
const basePolicy = require('@gtvmbh/eslint-config/src/default');
const typescriptPolicy = require('@gtvmbh/eslint-config/src/typescript');

const renamedRules = {
  '@typescript-eslint/no-throw-literal': '@typescript-eslint/only-throw-error',
  '@typescript-eslint/no-empty-interface': '@typescript-eslint/no-empty-object-type',
  '@typescript-eslint/no-var-requires': '@typescript-eslint/no-require-imports'
};

function migrateRules(rules) {
  return Object.fromEntries(Object.entries(rules).flatMap(([name, value]) => {
    if (renamedRules[name]) {
      return [[renamedRules[name], value]];
    }
    if (!name.startsWith('@typescript-eslint/')) {
      return [[name, value]];
    }
    const rule = name.slice('@typescript-eslint/'.length);
    if (typescript.rules[rule]) {
      return [[name, value]];
    }
    if (stylistic.rules[rule]) {
      return [[`@stylistic/ts/${rule}`, value]];
    }
    // Removed rules that were already disabled (ban-types, no-parameter-properties).
    if (value === 'off' || value === 0) {
      return [];
    }
    throw new Error(`No flat-config replacement configured for ${name}`);
  }));
}

// ESLint 8 recommended rules that newer presets remove or disable for TypeScript.
// Keep the previous lint contract even where the compiler also checks the code.
const historicalRules = Object.fromEntries([
  'constructor-super', 'getter-return', 'no-class-assign', 'no-const-assign',
  'no-dupe-args', 'no-dupe-keys', 'no-func-assign', 'no-import-assign',
  'no-inner-declarations', 'no-mixed-spaces-and-tabs', 'no-new-symbol',
  'no-obj-calls', 'no-redeclare', 'no-this-before-super', 'no-undef',
  'no-unreachable', 'no-unsafe-negation', 'no-with'
].map(rule => [rule, 'error']));

module.exports = function typescriptConfig(project, isAngular) {
  const angular = require('@angular-eslint/eslint-plugin');
  const template = require('@angular-eslint/eslint-plugin-template');
  return [{
    name: `reflex/typescript/${project}`,
    files: [`${project}/**/*.{ts,tsx,mts,cts}`],
    languageOptions: {
      parser,
      parserOptions: { project: `${project}/tsconfig.eslint.json`, tsconfigRootDir: require('node:path').resolve(__dirname, '../..') },
      globals: { ...globals.es2022, ...globals.browser, ...globals.node, ...globals.vitest }
    },
    plugins: {
      '@typescript-eslint': typescript,
      '@stylistic/ts': stylistic,
      ...(isAngular ? { '@angular-eslint': angular } : {})
    },
    ...(isAngular ? { processor: template.processors['extract-inline-html'] } : {}),
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs['eslint-recommended'].overrides[0].rules,
      ...typescript.configs.recommended.rules,
      ...typescript.configs['recommended-type-checked'].rules,
      ...basePolicy.rules,
      ...migrateRules(typescriptPolicy.rules),
      ...historicalRules,
      ...(project === 'tools/emulator' ? angular.configs.recommended.rules : {}),
      // Decorated classes are valid Angular declarations in newly covered projects.
      ...(!['tools/ReFlex.TrackingServer/ClientApp', 'examples/shared-components-demo'].includes(project)
        ? { '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }] } : {}),
      '@typescript-eslint/explicit-member-accessibility': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'new-cap': ['error', {
        capIsNew: true,
        capIsNewExceptions: [
          'Component', 'Directive', 'HostBinding', 'HostListener', 'Injectable',
          'Input', 'NgModule', 'Output', 'Pipe', 'ViewChild', 'ViewChildren'
        ],
        newIsCap: true,
        properties: true
      }]
    }
  }, {
    name: `reflex/angular-mocks/${project}`,
    files: [`${project}/**/*.mock.ts`],
    rules: { '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }] }
  }];
};
