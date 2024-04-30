// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-junit-reporter'),
      require('karma-viewport'),
      require('karma-spec-reporter')
    ],
    client: {
      jasmine:  {

      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, '../../test/artifacts/coverage'),
      subdir: 'reflex-emulator',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' },
        { type: 'cobertura' }
      ],
      fixWebpackSourcePaths: true,
      'report-config': {
        'text-summary': {
          file: 'text-summary.txt'
        }
      },
    },
    junitReporter: {
      outputDir: '../../test/artifacts/tests/',
      outputFile: 'junit-test-results-emulator.xml',
      useBrowserName: false,
    },
    reporters: ['progress', 'kjhtml', 'junit', 'spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true
  });
};
