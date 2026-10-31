const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');
const { ESLint } = require('eslint');

const root = path.resolve(__dirname, '../..');
const linter = new ESLint({ cwd: root });
const workspaces = require('../../package.json').workspaces;
const angularRoots = Object.values(require('../../angular.json').projects).map(project => project.root);

// Check the actual tracked and newly added source inventory, including test fixtures.
test('every workspace source file has an effective lint configuration', async () => {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root, encoding: 'utf8'
  }).split('\0').filter(file => /\.(?:[cm]?jsx?|[cm]?tsx?|vue)$/.test(file)
    || (file.endsWith('.html') && angularRoots.some(root => file.startsWith(`${root}/`))));
  for (const file of files) {
    if (!require('node:fs').existsSync(path.join(root, file))) continue;
    const config = await linter.calculateConfigForFile(path.join(root, file));
    assert.ok(config && Object.keys(config.rules).length > 0, `Unconfigured source file: ${file}`);
  }
});

test('tests, production environments and build configurations remain included', async () => {
  for (const workspace of workspaces) {
    assert.match(require(path.join(root, workspace, 'package.json')).scripts.lint, /max-warnings 0/);
  }
  for (const file of [
    'tools/ReFlex.TrackingServer/ClientApp/src/app/app.config.spec.ts',
    'tools/ReFlex.TrackingServer/ClientApp/src/environments/environment.prod.ts',
    'tools/ReFlex.TrackingServer/ClientApp/vitest.config.mts',
    'tools/ReFlex.TrackingServer/ClientApp/app.js',
    'tools/emulator/main.js',
    'scripts/build-electron.cjs'
  ]) {
    assert.equal(await linter.isPathIgnored(path.join(root, file)), false, file);
  }
});

test('historical checks and type-aware policy remain active', async () => {
  for (const workspace of ['tools/ReFlex.TrackingServer/ClientApp', 'examples/shared-components-demo']) {
    const config = await linter.calculateConfigForFile(path.join(root, workspace, 'src/main.ts'));
    for (const rule of [
      'no-undef', 'no-unreachable', 'no-redeclare', 'getter-return',
      'no-unsafe-negation', 'no-mixed-spaces-and-tabs', 'no-loss-of-precision',
      '@typescript-eslint/no-explicit-any', '@typescript-eslint/no-misused-promises',
      '@typescript-eslint/explicit-function-return-type', '@typescript-eslint/no-unused-vars'
    ]) {
      assert.equal(config.rules[rule][0], 2, `${workspace}: ${rule}`);
    }
    assert.ok(config.languageOptions.parserOptions.project);
  }
});

test('all Angular templates receive accessibility and template checks', async () => {
  for (const workspace of workspaces.filter(workspace => /angular-components|ClientApp|emulator|gestenrecorder|basic-angular|shared-components-demo/.test(workspace))) {
    const config = await linter.calculateConfigForFile(path.join(root, workspace, 'src/template.html'));
    assert.equal(config.rules['@angular-eslint/template/click-events-have-key-events'][0], 2, workspace);
    assert.equal(config.rules['@angular-eslint/template/eqeqeq'][0], 2, workspace);
  }
});


test('React hooks and Vue template violations are reported', async () => {
  const [react] = await linter.lintText(`
    import { useState } from 'react';
    export function App({ enabled }) {
      if (enabled) { useState(0); }
      return null;
    }
  `, { filePath: path.join(root, 'examples/basic-react/src/lint-probe.jsx') });
  assert.ok(react.messages.some(message => message.ruleId === 'react-hooks/rules-of-hooks'));

  const [vue] = await linter.lintText(`
    <template><ul><li v-for="item in items">{{ item }}</li></ul></template>
    <script>export default { name: 'ProbeList', data() { return { items: [1] }; } };</script>
  `, { filePath: path.join(root, 'examples/basic-vue/src/LintProbe.vue') });
  assert.ok(vue.messages.some(message => message.ruleId === 'vue/require-v-for-key'));
});
