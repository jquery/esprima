var configureSauceLabs = require('./configure-sauce-labs.js');

module.exports = function (config) {

    configureSauceLabs(config, 'Internet Explorer browsers', {
        IE_11: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '11.0'
        },
        IE_10: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '10.0'
        }

        /*
        IE_9: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '9.0'
        }
        */
    });

}
