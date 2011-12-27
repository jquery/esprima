// Unfortunately we have to use User Agent detection to blacklist the browsers.
/*jslint browser:true */
(function (window) {
    'use strict';
    var platform,
        ua,
        isMac,
        isWindows,
        isChrome,
        isSafari,
        version,
        majorVersion;

    platform = window.navigator.platform;
    ua = window.navigator.userAgent;

    isMac = (platform === 'MacIntel') || (platform === 'MacPPC');
    isWindows = (platform === 'Win32');
    isChrome = ua.match(/ Chrome\//) !== null;
    isSafari = !isChrome && (ua.match(/Safari\//) !== null);

    version = ua.match(/ Version\/([0-9]+)/);
    if (version && version.length > 1) {
        majorVersion = parseInt(version[1], 10);
    }

    window.checkEnv = function () {
        if (isSafari && (isMac || isWindows) && (majorVersion <= 3)) {
            throw new Error('CodeMirror does not support Safari <= 3');
        }
    };

}(window));
