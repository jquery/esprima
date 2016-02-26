// Based on https://gist.github.com/mathiasbynens/6334847 by @mathias

var regenerate = require('regenerate');

// Which Unicode version should be used?
var version = '8.0.0'; // note: also update `package.json` when this changes

// Shorthand function
var get = function(what) {
    return require('unicode-' + version + '/' + what + '/code-points');
};

var generateES6Regex = function() { // ES 6
    // https://mathiasbynens.be/notes/javascript-identifiers-es6
    var identifierStart = regenerate(get('properties/ID_Start'))
        .add('$', '_')
        .removeRange(0x0, 0x7F); // remove ASCII symbols (Esprima-specific)
    var identifierPart = regenerate(get('properties/ID_Continue'))
        .add(get('properties/Other_ID_Start'))
        .add('\u200C', '\u200D')
        .add('$', '_')
        .removeRange(0x0, 0x7F); // remove ASCII symbols (Esprima-specific)

    return {
        'NonAsciiIdentifierStart': '/' + identifierStart + '/',
        'NonAsciiIdentifierPart': '/' + identifierPart + '/'
    };
};

var result = generateES6Regex();
console.log(
    '// ECMAScript 6/Unicode v%s NonAsciiIdentifierStart:\n%s\n',
    version,
    result.NonAsciiIdentifierStart
);
console.log(
    '// ECMAScript 6/Unicode v%s NonAsciiIdentifierPart:\n%s',
    version,
    result.NonAsciiIdentifierPart
);
