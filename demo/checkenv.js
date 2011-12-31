// Unfortunately we have to use User Agent detection to blacklist the browsers.
/*jslint browser:true */
(function (window) {
    'use strict';

    var majorVersion = parseInt(window.platform.version.split('.')[0], 10);

    window.checkEnv = function () {
        if (window.platform.name === 'Safari' && majorVersion <= 3) {
            throw new Error('CodeMirror does not support Safari <= 3');
        }
        if (window.platform.name === 'Opera' && majorVersion <= 8) {
            throw new Error('CodeMirror does not support Opera <= 8');
        }
    };

}(window));
