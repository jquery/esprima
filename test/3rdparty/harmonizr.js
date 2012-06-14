var harmonizr = function() {

var parse = esprima.parse, Syntax = esprima.Syntax;

function harmonize(src, options) {
    options = options || {};
    return processModules(src, options, moduleStyles[options.style]);
}

function processModules(src, options, style) {
    if (options.module) {
        src = 'module ' + options.module + '{\n' + src + '\n}';
    }

    var ast = parse(src, { loc: true });

    var modules = [];

    traverse(ast, function(node) {
        if (node.type === Syntax.ModuleDeclaration) {
            modules.push(node);
            return false;
        }
    });

    var lines = src.split('\n');

    modules.forEach(function(mod) {

        options.indent = detectIndent(mod, lines);

        var imps = [];

        traverse(mod, function(node) {
            if (node.type === Syntax.ModuleDeclaration && node !== mod) {
                return false;
            } else if (node.type === Syntax.ImportDeclaration &&
                       node.specifiers[0].type !== Syntax.Glob) {
                imps.push(node);
            }
        });

        var moduleStartLine = mod.loc.start.line - 1;
        var moduleStartColumn = mod.loc.start.column;
        var moduleEndLine = mod.loc.end.line - 1;
        var moduleEndColumn = mod.loc.end.column;
        var bodyStartColumn = mod.body.loc.start.column;
        var bodyEndColumn = mod.body.loc.end.column;

        // Modify the end first in case it's on the same line as the start.
        lines[moduleEndLine] = splice(
            lines[moduleEndLine],
            bodyEndColumn - 1,
            1, // Delete the closing brace.
            style.endModule(mod, options));

        lines[moduleStartLine] = splice(
            lines[moduleStartLine],
            moduleStartColumn,
            bodyStartColumn - moduleStartColumn + 1, // Delete from start of module to opening brace.
            style.startModule(mod, imps, options));

        imps.forEach(function(imp) {
            var importStartLine = imp.loc.start.line - 1;
            var importStartColumn = imp.loc.start.column;
            var importEndColumn = imp.loc.end.column;
            lines[importStartLine] = splice(
                lines[importStartLine],
                importStartColumn,
                importEndColumn - importStartColumn,
                style.importDeclaration(mod, imp, options));
        });

        var exps = [];

        traverse(mod, function(node) {
            if (node.type === Syntax.ModuleDeclaration && node !== mod) {
                return false;
            } else if (node.type === Syntax.ExportDeclaration) {
                exps.push(node);
            }
        });

        exps.forEach(function(exp) {
            var exportStartLine = exp.loc.start.line - 1;
            var exportStartColumn = exp.loc.start.column;
            var declarationStartColumn = exp.declaration.loc.start.column;
            lines[exportStartLine] = splice(
                lines[exportStartLine],
                exportStartColumn,
                declarationStartColumn - exportStartColumn, // Delete the export keyword.
                ''); // Nothing to insert.
        });

        if (exps.length) {
            lines[moduleEndLine] = splice(
                lines[moduleEndLine],
                moduleEndColumn - 1,
                0,
                style.exports(mod, exps, options));
        }
    });

    src = lines.join('\n');

    return src;
}

var moduleStyles = {
    amd: {
        startModule: function(mod, imps, options) {
            var header = 'define(';
            if (imps.length) {
                header += '[\'' + imps.map(function(imp) { return modulePath(importFrom(imp), options); }).join('\', \'') + '\'], ';
            }
            header += 'function(';
            if (imps.length) {
                header += imps.map(function(imp) { return importFrom(imp); }).join(', ');
            }
            header += ') {';
            return header;
        },
        importDeclaration: function(mod, imp, options) {
            return 'var ' + imp.specifiers.map(function(spec) {
                var id = spec.type === Syntax.Identifier ? spec.name : spec.id.name;
                var from = spec.from ? joinPath(spec.from) : id;
                return id + ' = ' + importFrom(imp) + '.' + from;
            }).join(', ') + ';';
        },
        exports: function(mod, exps, options) {
            var indent = options.indent;
            var ret = indent;
            ret += 'return {';
            if (exps.length) {
                ret += '\n';
                ret += exps.map(function(exp) {
                    var id = exportName(exp);
                    return indent + indent + id + ': ' + id;
                }).join(',\n');
                ret += '\n';
                ret += indent;
            }
            ret += '};\n';
            return ret;
        },
        endModule: function(mod, options) {
            return '});';
        }
    },

    node: {
        startModule: function(mod, imps, options) {
            return '';
        },
        importDeclaration: function(mod, imp, options) {
            return 'var ' + importFrom(imp) +
                   ' = require(\'' + modulePath(importFrom(imp), options) + '\'), ' +
                   imp.specifiers.map(function(spec) {
                       var id = spec.type === Syntax.Identifier ? spec.name : spec.id.name;
                       var from = spec.from ? joinPath(spec.from) : id;
                       return id + ' = ' + importFrom(imp) + '.' + from;
                   }).join(', ') + ';';
        },
        exports: function(mod, exps, options) {
            var indent = options.indent;
            var returns = indent + 'module.exports = {';
            returns += '\n' + exps.map(function(exp) {
                var id = exportName(exp);
                return indent + indent + id + ': ' + id;
            }).join(',\n');
            returns += '\n' + indent;
            returns += '};\n';
            return returns;
        },
        endModule: function(mod, options) {
            return '';
        }
    },

    revealing: {
        startModule: function(mod, imps, options) {
            return 'var ' + mod.id.name + ' = function() {';
        },
        importDeclaration: function(mod, imp, options) {
            return 'var ' + imp.specifiers.map(function(spec) {
                var id = spec.type === Syntax.Identifier ? spec.name : spec.id.name;
                var from = spec.from ? joinPath(spec.from) : id;
                return id + ' = ' + importFrom(imp) + '.' + from;
            }).join(', ') + ';';
        },
        exports: function(mod, exps, options) {
            var indent = options.indent;
            var returns = indent + 'return {';
            if (exps.length) {
                returns += '\n' + exps.map(function(exp) {
                    var id = exportName(exp);
                    return indent + indent + id + ': ' + id;
                }).join(',\n');
                returns += '\n' + indent;
            }
            returns += '};\n';
            return returns;
        },
        endModule: function(mod, options) {
            return '}();';
        }
    }
};

function traverse(node, visitor) {
    if (visitor.call(null, node) === false) {
        return;
    }

    Object.keys(node).forEach(function(key) {
        var child = node[key];
        if (child && typeof child === 'object') {
            traverse(child, visitor);
        }
    });
}

function modulePath(moduleName, options) {
    var isRelative = options.relatives && options.relatives.indexOf(moduleName) !== -1;
    return (isRelative ? './' : '') + moduleName;
}

function importFrom(imp) {
    return imp.from.body[0].name;
}

function exportName(exp) {
    if (exp.declaration.type === Syntax.VariableDeclaration) {
        return exp.declaration.declarations[0].id.name;
    } else if (exp.declaration.type === Syntax.FunctionDeclaration) {
        return exp.declaration.id.name;
    }
}

function joinPath(path) {
    return path.body.map(function(id) {
        return id.name;
    }).join('.');
}

function splice(str, index, howMany, insert) {
    var a = str.split('');
    a.splice(index, howMany, insert);
    return a.join('');
}

function detectIndent(mod, lines) {
    var moduleBodyStartLine = mod.body.loc.start.line - 1;
    var line = lines[moduleBodyStartLine + 1];
    if (line) {
        var m = line.match(/^(\s*)\S/);
        if (m) {
            return m[1];
        }
    }
    return '';
}

return {
harmonize: harmonize,
moduleStyles: moduleStyles
};
}();
