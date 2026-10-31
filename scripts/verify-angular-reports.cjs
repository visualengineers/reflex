const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workspace = require('../angular.json');
const requested = process.argv.slice(2);
const reports = requested.length
  ? [{ coverage: requested[0], junit: requested[1] }]
  : Object.values(workspace.projects).map(project => {
      const options = project.architect.test.options;
      const config = fs.readFileSync(path.join(root, options.runnerConfig), 'utf8');
      const coverage = config.match(/test\/artifacts\/coverage\/([^/]+)\//)[1];
      return { coverage, junit: path.basename(options.reporters[1][1].outputFile) };
    });

for (const report of reports) {
  const coverage = path.join(root, 'test/artifacts/coverage', report.coverage);
  for (const file of ['index.html', 'lcov.info', 'cobertura-coverage.xml', 'text-summary.txt']) {
    assert(fs.statSync(path.join(coverage, file)).size > 0, `Empty coverage report: ${file}`);
  }
  const xml = fs.readFileSync(path.join(root, 'test/artifacts/tests', report.junit), 'utf8');
  assert(/<testsuite\b[^>]*\btests="[1-9]\d*"/.test(xml), `No tests in ${report.junit}`);
  assert(!/<testsuite\b[^>]*\b(?:failures|errors)="[1-9]\d*"/.test(xml), `Failed tests in ${report.junit}`);
  console.log(`Verified ${report.coverage}: HTML, LCOV, Cobertura, summary and JUnit`);
}
