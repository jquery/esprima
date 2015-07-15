module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'leche'],

    files: [
      'esprima.js',
      'test/unit-tests.js',
    ],

    exclude: [],

    client: {
      mocha: {
        reporter: 'html', // change Karma's debug.html to the mocha web reporter
        ui: 'bdd'
      }
    },

    preprocessors: {
        'test/unit-tests.js': ['webpack', 'sourcemap'],
    },

    webpack: {
        devtool: '#inline-source-map'
    },

    reporters: ['dots'], // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    port: 9876,
    colors: true,
    logLevel: config.LOG_WARN, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    autoWatch: true,
    singleRun: false,

    browsers:
    ['Chrome'],
    // ['PhantomJS'],

  });
}
