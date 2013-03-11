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
            window.editor.removeAllErrorMarkers();
        }

        try {
            result = esprima.parse(code, { tolerant: true, loc: true }).errors;
            if (result.length > 0) {
                str = 'Found <b>' + result.length + '</b> issues.';
                for (i = 0; i < result.length; i += 1) {
                    window.editor.addErrorMarker(result[i].index, result[i].description);
                }
            } else {
                str = 'No syntax error.';
            }
            console.log(str);
        } catch (e) {
            window.editor.addErrorMarker(e.index, e.description);
            str = 'Found a critical issue.';
        } finally {
            document.getElementById('result').innerHTML = str;
        }

        validateId = undefined;
    }, delay || 811);
}

window.onload = function () {
    try {
        require(['custom/editor'], function (editor) {
            window.editor = editor({ parent: 'editor', lang: 'js' });
            window.editor.getTextView().getModel().addEventListener("Changed", validate);
        });
        validate(55);
    } catch (e) {
    }
};
