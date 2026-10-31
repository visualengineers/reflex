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

module.exports = function typescriptConfig(tsconfigRootDir) {
  return [
    {
      name: 'reflex/generated-and-excluded-files',
      ignores: [
        '**/node_modules/**', '**/.angular/**', '**/dist/**', '**/e2e/**',
        '**/obj/**', '**/artifacts/**', '**/documentation/**',
        '**/app.js', '**/preload.js', '**/aspnetcore-https.js',
        '**/*.conf.js', '**/eslint.config.js', '**/.*',
        'src/**/*.spec.ts', 'src/**/*.mock.ts', 'src/polyfills.ts', 'src/test.ts',
        '**/environment.prod.ts', '**/environment.test.ts'
      ]
    },
    {
      name: 'reflex/typescript',
      files: ['**/*.ts'],
      languageOptions: {
        parser,
        parserOptions: { project: './tsconfig.json', tsconfigRootDir },
        globals: { ...globals.browser, ...globals.node, ...globals.jest }
      },
      plugins: { '@typescript-eslint': typescript, '@stylistic/ts': stylistic },
      rules: {
        ...js.configs.recommended.rules,
        ...typescript.configs['eslint-recommended'].overrides[0].rules,
        ...typescript.configs.recommended.rules,
        ...typescript.configs['recommended-type-checked'].rules,
        ...basePolicy.rules,
        ...migrateRules(typescriptPolicy.rules),
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
    }
  ];
};
