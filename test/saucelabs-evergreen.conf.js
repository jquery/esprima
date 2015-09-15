var configureSauceLabs = require('./configure-sauce-labs.js');

module.exports = function (config) {

    configureSauceLabs(config, 'Evergreen browsers', {
        Edge: {
            base: 'SauceLabs',
            browserName: 'microsoftedge',
            platform: 'Windows 10'
        },
        Chrome: {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'Linux'
        },
        Chrome_Mobile: {
            base: 'SauceLabs',
            browserName: 'android',
            platform: 'Linux'
        },
        Firefox: {
            base: 'SauceLabs',
            browserName: 'firefox',
            platform: 'Linux'
        },
        Safari: {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.11'
        }
    });

}
