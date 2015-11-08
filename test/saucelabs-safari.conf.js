var configureSauceLabs = require('./configure-sauce-labs.js');

module.exports = function (config) {

    configureSauceLabs(config, 'Safari browsers', {
        Safari_8: {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.10',
            version: '8.0'
        },
        Safari_7: {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.9',
            version: '7.0'
        },
        MobileSafari_9: {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.11',
            version: '9.0'
        },
        MobileSafari_8: {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.11',
            version: '8.4'
        }
    });

}
