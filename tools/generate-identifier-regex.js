// Based on https://gist.github.com/mathiasbynens/6334847 by @mathias

var regenerate = require('regenerate');

// Which Unicode version should be used?
var pkg = require('../package.json');
var dependencies = Object.keys(pkg.devDependencies);
var unicodeDep = dependencies.find((name) => /^unicode-\d/.test(name));
var version = unicodeDep.match(/[^\d]+(.+)$/)[1];

// Shorthand function
var get = function(what) {
    return require(unicodeDep + '/' + what + '/code-points.js');
};

var generateRegex = function() { // ES 6
    // https://mathiasbynens.be/notes/javascript-identifiers-es6
    var identifierStart = regenerate(get('Binary_Property/ID_Start'))
        .add('$', '_')
        .removeRange(0x0, 0x7F); // remove ASCII symbols (Esprima-specific)
    var identifierPart = regenerate(get('Binary_Property/ID_Continue'))
        .add(get('Binary_Property/Other_ID_Start'))
        .add('\u200C', '\u200D')
        .add('$', '_')
        .removeRange(0x0, 0x7F); // remove ASCII symbols (Esprima-specific)

    return {
        'NonAsciiIdentifierStart': '/' + identifierStart + '/',
        'NonAsciiIdentifierPart': '/' + identifierPart + '/'
    };
};

var result = generateRegex();
console.log(
    '// Unicode v%s NonAsciiIdentifierStart:\n%s\n',
    version,
    result.NonAsciiIdentifierStart
);
console.log(
    '// Unicode v%s NonAsciiIdentifierPart:\n%s',
    version,
    result.NonAsciiIdentifierPart
);
