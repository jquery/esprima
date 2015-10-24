module.exports = function (config) {
    config.set({
        basePath: '..',
        frameworks: [
            'mocha',
            'detectBrowsers'
        ],

        files: [
            'dist/esprima.js',
            'node_modules/lodash/index.js',
            'test/dist/fixtures_js.js',
            'test/dist/fixtures_json.js',
            'test/utils/error-to-object.js',
            'test/utils/create-testcases.js',
            'test/utils/evaluate-testcase.js',
            'test/browser-tests.js'
        ],

        exclude: [],

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

        detectBrowsers: {
            enabled: true,
            usePhantomJS: false
        },

        plugins: [
            'karma-mocha',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-ie-launcher',
            'karma-safari-launcher',
            'karma-detect-browsers'
        ]

    });
}
