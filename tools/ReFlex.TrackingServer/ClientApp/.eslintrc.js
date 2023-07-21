module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
      'browser': true,
      'node': true,
      'es2020': true,
      'jest': true
    },    
    parserOptions: {
      'sourceType': 'module',
      'project': './tsconfig.json',
    },
    extends: [
      '@gtvmbh/eslint-config/eslint-config-ts'
    ],
    plugins: [
      'angular', 
      '@typescript-eslint'
    ],
    settings: { 'angular': 2 },
    ignorePatterns: [
      'app.js',
      '/.angular',
      '/node_modules',
      '/dist',
      '/e2e',
      '/obj',
      '.eslintrc.js',
      'src/**/*.spec.ts',
      'src/**/*.mock.ts',
      '*.conf.js',
      'src/polyfills.ts',
      'src/test.ts',
      'environment.prod.ts',
      'environment.test.ts',
      '/artifacts',
      '/documentation',
      'preload.js'
    ],
    rules: {
      "no-shadow": "off",
      'new-cap': [
        'error',
        {
              capIsNew: true,
              capIsNewExceptions: [
                    'Component',
                    'Directive',
                    'HostBinding',
                    'HostListener',
                    'Injectable',
                    'Input',
                    'NgModule',
                    'Output',
                    'Pipe',
                    'ViewChild',
                    'ViewChildren'
            ],
            newIsCap: true,
            properties: true
        }
      ],
      "@typescript-eslint/no-shadow": ["error"],
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-unused-vars-experimental": "off",
    }
  }
