module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'leche'],

    files: [
      'test/fixtures/**/*.json',
      'test/fixtures/**/*.js',
      'node_modules/lodash/index.js',
      'esprima.js',
      'test/unit-tests.js',
      'test/tests/*.js',
    ],

    exclude: [],

    // https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/fixtures/**/*.js': ['js2js'],
      'test/fixtures/**/*.json': ['json_fixtures']
    },

    jsonFixturesPreprocessor: {

      // stripPrefix: 'test/fixtures',

      // change the global fixtures variable name
      variableName: '__mocks__',

      transformPath: function(path) {
        return path;
      }
    },

    client: {
      mocha: {
        reporter: 'html', // change Karma's debug.html to the mocha web reporter
        ui: 'bdd'
      }
    },

    reporters: ['dots'], // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    port: 9876,
    colors: true,
    logLevel: config.LOG_WARN, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    autoWatch: true,
    singleRun: false,

    browsers:
    //['Chrome'],
    ['PhantomJS'],

  });
}
