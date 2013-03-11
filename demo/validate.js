/*jslint sloppy:true browser:true */
/*global esprima:true, require:true */
var validateId;

function validate(delay) {
    if (validateId) {
        window.clearTimeout(validateId);
    }

    validateId = window.setTimeout(function () {
        var code, result, i, str;

        if (typeof window.editor === 'undefined') {
            code = document.getElementById('editor').value;
        } else {
            code = window.editor.getText();
        }

        try {
            result = esprima.parse(code, { tolerant: true, loc: true }).errors;
            if (result.length > 0) {
                str = '<p>Found <b>' + result.length + '</b>:</p>';
                for (i = 0; i < result.length; i += 1) {
                    str += '<p>' + result[i].message + '</p>';
                }
            } else {
                str = '<p>No syntax error.</p>';
            }
        } catch (e) {
            str = e.name + ': ' + e.message;
        }
        document.getElementById('result').innerHTML = str;

        validateId = undefined;
    }, delay || 811);
}

window.onload = function () {
    var id, el;

    id = function (i) {
        return document.getElementById(i);
    };

    el = id('version');
    if (typeof el.innerText === 'string') {
        el.innerText = esprima.version;
    } else {
        el.textContent = esprima.version;
    }

    try {
        require(['custom/editor'], function (editor) {
            window.editor = editor({ parent: 'editor', lang: 'js' });
        });
        validate(55);
    } catch (e) {
    }
};
