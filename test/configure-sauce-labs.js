module.exports = function (config, name, launchers) {
    'use strict';

    config.set({
        basePath: '..',
        frameworks: [
            'mocha'
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

        logLevel: config.LOG_WARN, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        reporters: ['saucelabs'],
        port: 9876,
        colors: true,
        singleRun: true,
        captureTimeout: 2 * 60 * 1000,
        browserNoActivityTimeout: 3 * 60 * 1000,
        browserDisconnectTimeout : 3 * 60 * 1000,
        browserDisconnectTolerance : 2,

        sauceLabs: {
            testName: name,
            build: process.env.GIT_COMMIT.substr(0, 10),
            startConnect: false,
            recordScreenshots: false
        },
        browsers: Object.keys(launchers),
        customLaunchers: launchers
    });
}
