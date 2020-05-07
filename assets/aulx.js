(function (global, factory) {
  // Universal Module Definition (UMD) to support AMD, Node.js,
  // and plain browser loading.
  if (typeof exports === 'object') {
    module.exports = factory(require('esprima'));
  } else if (typeof define === 'function' && define.amd) {
    define(['esprima'], factory);
  } else {
    global.Aulx = factory(global.esprima);
  }
}(this, function (esprima) {
var exports = {};


// Map from language file extensions to functions that can autocomplete the
// source editor.
//
// Parameters:
//  - source: String of the source code.
//  - caret: Object containing two fields:
//    * line: the line number of the caret, starting with zero.
//    * ch: the column of the caret, starting with zero.
//  - options: Object containing optional parameters.
//
// Return an object with the following fields:
//  - candidates: A list of the matches to a possible completion.
//  - completions: A list of the associated completion to a candidate.
var completer = {};

exports = completer;


// Helper: Map implementation (will be removed when ES6 comes along).
//
// It is designed to be fast, but not 100% compatible with ES6.
// Notably, map.getKeys returns a list of keys, since you cannot iterate
// through a map in ES5 the same way you would in ES6.
//
// Note: may fail in case you unexpectedly use __proto__ as a key.

// Firefox landed Maps without forEach, hence the odd check for that.
// Update: the forEach implementation is flawed for now.
var Map = this.Map;
if (true /* !(Map && Map.prototype.forEach) */) {
  var Map = function Map() { this._m = Object.create(null); };

  Map.prototype = {
    get: function(key) {
      return this._m[key];
    },
    has: function(key) {
      return this._m[key] !== undefined;
    },
    set: function(key, value) {
      if (key !== '__proto__') { this._m[key] = value; }
    },
    delete: function(key) {
      if (this.has(key)) {
        delete this._m[key];
        return true;
      } else {
        return false;
      }
    },
    forEach: function(callbackfn, thisArg) {
      callbackfn = callbackfn.bind(thisArg);
      for (var i in this._m) {
        callbackfn(this._m[i], i, this);
      }
    },
    get toString() {
      return JSON.stringify(this._m);
    }
  };
}


// Completion-related data structures.
//

// The only way to distinguish two candidates is through how they are displayed.
// That's how the user can tell the difference, too.
function Candidate(display, prefix, score) {
  this.display = display;   // What the user sees.
  this.prefix = prefix;   // What is added when selected.
  this.score = score|0;     // Its score.
}

function Completion() {
  this.candidateFromDisplay = new Map();
  this.candidates = [];
}

Completion.prototype = {
  insert: function(candidate) {
    this.candidateFromDisplay.set(candidate.display, candidate);
    this.candidates.push(candidate);
  },
  meld: function(completion) {
    for (var i = 0; i < completion.candidates.length; i++) {
      var candidate = completion.candidates[i];
      if (!this.candidateFromDisplay.has(candidate.display)) {
        // We do not already have this candidate.
        this.insert(candidate);
      }
    }
  },
  sort: function() {
    this.candidates.sort(function(a, b) {
      // A huge score comes first.
      return b.score - a.score;
    });
  }
};



// Shared function: inRange.
// Detect whether an index is within a range.
function inRange(index, range) {
  return index > range[0] && index <= range[1];
}
(function(exports) {
//
// Instantiate an Aulx object for JS autocompletion.
//
// Parameters:
//  - options: Object containing optional parameters:
//    * contextFrom: Part of the source necessary to get the context.
//      May be a string of the current line (which the editor may provide
//      more efficiently than the default way).
//      Use this if you know that reduceContext() is too slow for you.
//    * global: global object. Can be used to perform level 1 (see above).
//    * parse: a JS parser that is compatible with
//      https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
//    * parserContinuation: boolean. If true, the parser has a callback argument
//      which is called with the AST.
//    * globalIdentifier: A String to identify the symbol representing the
//      JS global object, such as 'window' (the default), for static analysis
//      purposes.
//
function JS(options) {
  this.options = options || {};
  this.options.parse = this.options.parse ||
                       (this.options.parserContinuation = false, esprima.parse);
  this.options.globalIdentifier = this.options.globalIdentifier || 'window';
  this.staticCandidates = null;
}

//
// Get a list of completions we can have, based on the state of the editor.
// Autocompletion happens based on the following factors
// (with increasing relevance):
//
// Level 0 = JS keywords.
// Level 1 = dynamic lookup of available properties.
// Level 2 = static analysis of the code.
//
// Use candidates for UI purposes, and completions when inserting the completion
// in the editor.
//
// Parameters:
//  - source: String of the source code.
//  - caret: Object containing two fields:
//    * line: the line number of the caret, starting with zero.
//    * ch: the column of the caret, starting with zero.
//
// Return a sorted Completion (see entrance/completers.js).
//  - candidateFromDisplay: Map from display string to candidate.
//  - candidates: A list of candidates:
//    * display: a string of what the user sees.
//    * prefix: a string of what is added when the user chooses this.
//    * score: a number to grade the candidate.
//
function jsCompleter(source, caret) {
  var completion = new Completion();

  // Caching the result of a static analysis for perf purposes.
  if (!this.staticCandidates) {
    this.updateStaticCache(source, caret,
        { parse: this.options.parse,
          parserContinuation: this.options.parserContinuation });
  }

  // We use a primitive sorting algorithm.
  // The candidates are simply concatenated, level after level.
  // We assume that Level 0 < Level 1 < etc.
  // FIXME: implement a score-based system that adjusts its weights based on
  // statistics from what the user actually selects.

  var context = getContext(this.options.contextFrom || source, caret);
  if (!context) {
    // We couldn't get the context, we won't be able to complete.
    return completion;
  }

  // Static analysis (Level 2).

  if (this.staticCandidates) {
    // They have a non-negative score.
    var staticCompletion = this.staticAnalysis(context,
        {globalIdentifier: this.options.globalIdentifier});
    if (!!staticCompletion) { completion.meld(staticCompletion); }
  }

  // Sandbox-based candidates (Level 1).

  if (this.options.global !== undefined) {
    // They have a score of -1.
    var sandboxCompletion = this.identifierLookup(this.options.global, context);
    if (!!sandboxCompletion) { completion.meld(sandboxCompletion); }
  }

  // Keyword-based candidates (Level 0).

  // This autocompletion is only meaningful with identifiers.
  if (context.completing === Completing.identifier &&
      context.data.length === 1) {
    var keywordCompletion = new Completion();
    for (var keyword in JSKeywords) {
      // The keyword must match and have something to add!
      if (keyword.indexOf(context.data[0]) == 0
          && keyword.length > context.data[0].length) {
        keywordCompletion.insert(new Candidate(
              keyword,
              context.data[0],
              JSKeywords[keyword]));
        // The score depends on the frequency of the keyword.
        // See keyword.js
      }
    }
    completion.meld(keywordCompletion);
  }

  completion.sort();
  return completion;
}

JS.prototype.complete = jsCompleter;

function fireStaticAnalysis(source, caret) {
  this.updateStaticCache(source, caret,
      { parse: this.options.parse,
        parserContinuation: this.options.parserContinuation });
}

JS.prototype.fireStaticAnalysis = fireStaticAnalysis;

// Same as `(new aulx.JS(options)).complete(source, caret)`.
function js(source, caret, options) {
  return (new JS(options)).complete(source, caret);
}

exports.js = js;
exports.JS = JS;


// Generic helpers.
//

// Autocompletion types.

var Completing = {  // Examples.
  identifier: 0,    // foo.ba|
  property: 1,      // foo.|
  string: 2,        // "foo".|
  regex: 3          // /foo/.|
};
js.Completing = Completing;

// Fetch data from the position of the caret in a source.
// The data is an object containing the following:
//  - completing: a number from the Completing enumeration.
//  - data: information about the context. Ideally, a list of strings.
//
// For instance, `foo.bar.baz|`
// (with the caret at the end of baz, even if after whitespace)
// will return `{completing:0, data:["foo", "bar", "baz"]}`.
//
// If we cannot get an identifier, returns `null`.
//
// Parameters:
//  - source: a string of JS code.
//  - caret: an object {line: 0-indexed line, ch: 0-indexed column}.
function getContext(source, caret) {
  var reduction = reduceContext('' + source, caret);
  if (reduction === null) { return null; }
  caret = reduction[1];
  var tokens = esprima.tokenize(reduction[0], {loc:true});

  // At this point, we know we were able to tokenize it.
  // Find the token just before the caret.
  // In order to do that, we use dichotomy.
  var lowIndex = 0;
  var highIndex = tokens.length - 1;
  var tokIndex = (tokens.length / 2) | 0;   // Truncating to an integer.
  var tokIndexPrevValue = tokIndex;
  var lastCall = false;
  var token;
  while (lowIndex <= highIndex) {
    token = tokens[tokIndex];
    if (!token) { return null; }
    // Note: The caret is on the first line (as a result of reduceContext).
    // Also, Esprima lines start with 1.
    if (token.loc.start.line > 1) {
      highIndex = tokIndex;
    } else {
      // Now, we need the correct column.
      var range = [
        token.loc.start.column,
        token.loc.end.column
      ];
      if (inRange(caret.ch, range)) {
        // We're done. We've found the token in which the cursor is.
        return contextFromToken(tokens, tokIndex, caret);
      } else if (caret.ch <= range[0]) {
        highIndex = tokIndex;
      } else if (range[1] < caret.ch) {
        lowIndex = tokIndex + 1;
      }
    }
    tokIndex = (highIndex + lowIndex) >>> 1;
    if (lastCall) { break; }
    if (tokIndex === tokIndexPrevValue) {
      tokIndex++;
      lastCall = true;
    } else { tokIndexPrevValue = tokIndex; }
  }
  return contextFromToken(tokens, tokIndex, caret);
};
js.getContext = getContext;

// Either
//
//  {
//    completing: Completing.<type of completion>,
//    data: <Array of string>
//  }
//
// or undefined.
//
// Parameters:
//  - tokens: list of tokens.
//  - tokIndex: index of the token where the caret is.
//  - caret: {line:0, ch:0}, position of the caret.
function contextFromToken(tokens, tokIndex, caret) {
  var token = tokens[tokIndex];
  var prevToken = tokens[tokIndex - 1];
  if (!token) { return; }
  if (token.type === "Punctuator" && token.value === '.') {
    if (prevToken) {
      if (prevToken.type === "Identifier" ||
         (prevToken.type === "Keyword" && prevToken.value === "this")) {
        // Property completion.
        return {
          completing: Completing.property,
          data: suckIdentifier(tokens, tokIndex, caret)
        };
      } else if (prevToken.type === "String") {
        // String completion.
        return {
          completing: Completing.string,
          data: []  // No need for data.
        };
      } else if (prevToken.type === "RegularExpression") {
        // Regex completion.
        return {
          completing: Completing.regex,
          data: []  // No need for data.
        };
      }
    }
  } else if (token.type === "Identifier") {
    // Identifier completion.
    return {
      completing: Completing.identifier,
      data: suckIdentifier(tokens, tokIndex, caret)
    };
  }
};

// suckIdentifier aggregates the whole identifier into a list of strings, taking
// only the part before the caret.
//
// This function assumes that the caret is on the token designated by `tokIndex`
// (which is its index in the `tokens` array).
//
// For instance, `foo.bar.ba|z` gives `['foo','bar','ba']`.
function suckIdentifier(tokens, tokIndex, caret) {
  var token = tokens[tokIndex];
  if (token.type !== "Identifier" &&
      token.type !== "Punctuator") {
    // Nothing to suck. Nothing to complete.
    return null;
  }

  // We now know there is something to suck into identifier.
  var identifier = [];
  while (token.type === "Identifier" ||
         (token.type === "Punctuator" && token.value === '.') ||
         (token.type === "Keyword" && token.value === "this")) {
    if (token.type === "Identifier" ||
        token.type === "Keyword") {
      var endCh = token.loc.end.column;
      var tokValue;
      if (caret.ch < endCh) {
        tokValue = token.value.slice(0, endCh - caret.ch + 1);
      } else {
        tokValue = token.value;
      }
      identifier.unshift(tokValue);
    }
    if (tokIndex > 0) {
      tokIndex--;
      token = tokens[tokIndex];
    } else {
      return identifier;
    }
  }
  return identifier;
};



// Reduce the amount of source code to contextualize,
// and the re-positionned caret in this smaller source code.
//
// For instance, `foo\nfoo.bar.baz|`
// will return `['foo.bar.baz', {line:0, ch:11}]`.
//
// If we cannot get an identifier, returns `null`.
//
// Parameters:
//  - source: a string of JS code.
//  - caret: an object {line: 0-indexed line, ch: 0-indexed column}.
function reduceContext(source, caret) {
  var line = 0;
  var column = 0;
  var fakeCaret = {line: caret.line, ch: caret.ch};

  // Find the position of the previous line terminator.
  var iLT = 0;
  var newSpot;
  var changedLine = false;
  var haveSkipped = false;

  var i = 0;
  var ch;
  var nextch;
  while ((line < caret.line
          || (line === caret.line && column < caret.ch))
         && i < source.length) {
    ch = source.charCodeAt(i);

    // Count the lines.
    if (isLineTerminator(ch)) {
      line++;
      column = 0;
      i++;
      iLT = i;
      continue;
    } else {
      column++;
    }

    if (ch === 34 || ch === 39) {
      // Single / double quote: starts a string.
      newSpot = skipStringLiteral(source, i, iLT - 1, line, column);
      haveSkipped = true;
      changedLine = line < newSpot.line;

      i = newSpot.index;
      line = newSpot.line;
      column = newSpot.column;
    } else if (ch === 47) {
      // Slash.
      nextch = source.charCodeAt(i + 1);
      prevch = source.charCodeAt(i - 1);
      if (nextch === 42 && prevch !== 92) {
        // Star: we have a multiline comment.
        // Not a backslash before: it isn't in a regex.
        newSpot = skipMultilineComment(source, i, line, column);
        haveSkipped = true;
        changedLine = line < newSpot.line;

        i = newSpot.index;
        line = newSpot.line;
        column = newSpot.column;
      } else if (nextch === 47) {
        // Two consecutive slashes: we have a single-line comment.
        i++;
        while (!isLineTerminator(ch) && i < source.length) {
          ch = source.charCodeAt(i);
          i++;
          column++;
        }
        // `i` is on a line terminator.
        i -= 2;
      }
    }

    if (haveSkipped && isLineTerminator(source.charCodeAt(i))) {
      haveSkipped = false;
      continue;
    }
    if (changedLine) {
      // Have we gone too far?
      if (line > caret.line || line === caret.line && column > caret.ch + 1) {
        return null;
      } else if (line === caret.line) {
        iLT = i;
        // We need to reset the fake caret's position.
        column = 0;
      }
      changedLine = false;
    } else {
      i++;
    }
  }

  fakeCaret.line = 0;
  fakeCaret.ch = column;
  // We can limit tokenization between beginning of line
  // to position of the caret.
  return [source.slice(iLT, iLT + column + 1), fakeCaret];
}

// Useful functions stolen from Esprima.


// Invisible characters.

// 7.2 White Space

function isWhiteSpace(ch) {
    return (ch === 32) ||  // space
        (ch === 9) ||      // tab
        (ch === 0xB) ||
        (ch === 0xC) ||
        (ch === 0xA0) ||
        (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(String.fromCharCode(ch)) > 0);
}

// 7.3 Line Terminators

function isLineTerminator(ch) {
    return (ch === 10) || (ch === 13) || (ch === 0x2028) || (ch === 0x2029);
}


// Strings.

// 7.8.4 String Literals

// This Esprima algorithm was heavily modified for my purposes.
//
// Parameters:
// - source: code
// - index: position of the opening quote.
// - indexAtStartOfLine: position of the first character of the current line,
//   minus one.
// - lineNumber: starting from 0.
// - column: number.
//
// It returns the following object:
// - index: of the character after the end.
// - line: line number at the end of the string.
// - column: column number of the character after the end.
function skipStringLiteral(source, index, indexAtStartOfLine,
      lineNumber, column) {
    var quote, ch, code, restore;
    var length = source.length;

    quote = source[index];
    ++index;

    while (index < length) {
        ch = source[index++];

        if (ch === quote) {
            break;
        } else if (ch === '\\') {
            ch = source[index++];
            if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                switch (ch) {
                case 'n': break;
                case 'r': break;
                case 't': break;
                case 'u':
                case 'x':
                    restore = index;
                    index = scanHexEscape(source, index, ch);
                    if (index < 0) {
                        index = restore;
                    }
                    break;
                case 'b': break;
                case 'f': break;
                case 'v': break;

                default:
                    if (isOctalDigit(ch)) {
                        code = '01234567'.indexOf(ch);

                        if (index < length && isOctalDigit(source[index])) {
                            code = code * 8 + '01234567'.indexOf(source[index++]);

                            // 3 digits are only allowed when string starts
                            // with 0, 1, 2, 3
                            if ('0123'.indexOf(ch) >= 0 &&
                                    index < length &&
                                    isOctalDigit(source[index])) {
                                code = code * 8 + '01234567'.indexOf(source[index++]);
                            }
                        }
                    }
                    break;
                }
            } else {
                ++lineNumber;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                indexAtStartOfLine = index;
            }
        } else if (isLineTerminator(ch.charCodeAt(0))) {
            ++lineNumber;
            indexAtStartOfLine = index;
            break;
        }
    }

    return {
      index: index,
      line: lineNumber,
      column: index - indexAtStartOfLine
    };
}

function scanHexEscape(source, index, prefix) {
    var i, len, ch, code = 0;

    len = (prefix === 'u') ? 4 : 2;
    for (i = 0; i < len; ++i) {
        if (index < source.length && isHexDigit(source[index])) {
            ch = source[index++];
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        } else {
            return -1;
        }
    }
    return index;
}

function isOctalDigit(ch) {
    return '01234567'.indexOf(ch) >= 0;
}

function isHexDigit(ch) {
    return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
}

// The following function is not from Esprima.
// The index must be positioned in the source on a slash
// that starts a multiline comment.
//
// It returns the following object:
// - index: of the character after the end.
// - line: line number at the end of the comment.
// - column: column number of the character after the end.
function skipMultilineComment(source, index, line, targetLine, column) {
  var ch = 47;
  while (index < source.length) {
    ch = source[index].charCodeAt(0);
    if (ch == 42) {
      // Current character is a star.
      if (index === source.length - 1) {
        break;
      }
      if (source[index + 1].charCodeAt(0) === 47) {
        // Next character is a slash.
        index += 2;
        column += 2;
        break;
      }
    }

    index++;
    if (isLineTerminator(ch)) {
      line++;
      column = 0;
    } else {
      column++;
    }
  }
  return {
    index: index,
    line: line,
    column: column
  };
}
// Return a Completion instance, or undefined.
// Parameters:
// - context: result of the getContext function.
function staticAnalysis(context) {
  var staticCompletion = new Completion();
  var completingIdentifier = (context.completing === Completing.identifier);
  var completingProperty = (context.completing === Completing.property);

  var varName;   // Each will modify this to the start of the variable name.
  var eachProperty = function eachProperty(store, display) {
    if (display.indexOf(varName) == 0
        && display.length > varName.length) {
      // The candidate must match and have something to add!
      try {
        var tokens = esprima.tokenize(display);
        if (tokens.length === 1 && tokens[0].type === "Identifier") {
          staticCompletion.insert(new Candidate(display,
              varName, store.weight));
        }
      } catch (e) {} // Definitely not a valid property.
    }
  };

  if (completingIdentifier && context.data.length === 1) {
    varName = context.data[0];
    // They have a positive score.
    this.staticCandidates.properties.forEach(eachProperty);
    if (this.options.globalIdentifier &&
        this.staticCandidates.properties.get(this.options.globalIdentifier)) {
      // Add properties like `window.|`.
      this.staticCandidates.properties.get(this.options.globalIdentifier).properties
        .forEach(eachProperty);
    }

  } else if (completingIdentifier || completingProperty) {
    var store = this.staticCandidates;
    for (var i = 0; i < context.data.length - 1; i++) {
      store = store.properties.get(context.data[i]);
      if (!store) { return; }
    }

    varName = context.data[i];
    if (completingProperty) {
      store = store.properties.get(varName);
      if (!store) { return; }
      varName = '';  // This will cause the indexOf check to succeed.
    }
    store.properties.forEach(eachProperty);

    // Seek data from its type.
    if (!!store.type) {
      store.type.forEach(function(sourceIndices, funcName) {
        funcStore = this.staticCandidates.properties.get(funcName);
        if (!funcStore) { return; }
        for (var i = 0; i < store.type.get(funcName).length; i++) {
          var sourceIndex = store.type.get(funcName)[i];
          // Each sourceIndex corresponds to a source,
          // and the `sources` property is that source.
          if (funcStore.sources) {
            funcStore.sources[sourceIndex].properties.forEach(eachProperty);
            if (sourceIndex === 0) {
              // This was a constructor.
              var protostore = funcStore.properties.get('prototype');
              if (!protostore) { return; }
              protostore.properties.forEach(eachProperty);
            }
          }
        }
      }.bind(this));
    }
  }
  return staticCompletion;
}

JS.prototype.staticAnalysis = staticAnalysis;

// Static analysis helper functions.

//
// Get all the variables in a JS script at a certain position.
// This gathers variable (and argument) names by means of a static analysis
// which it performs on a parse tree of the code.
//
// Returns a TypeStore object. See below.
// We return null if we could not parse the code.
//
// This static scope system is inflexible. If it can't parse the code, it won't
// give you anything.
//
// Parameters:
// - source: The JS script to parse.
// - caret: {line:0, ch:0} The line and column in the scrip
//   from which we want the scope.
//
function updateStaticCache(source, caret) {
  this.options.store = this.options.store || new TypeStore();
  try {
    if (!!this.options.parserContinuation) {
      this.options.parse(source, {loc:true}, function(tree) {
        this.staticCandidates = getStaticScope(tree.body, caret)
            || this.staticCandidates;  // If it fails, use the previous version.
      }.bind(this));
    } else {
      var tree = this.options.parse(source, {loc:true});
      this.staticCandidates = getStaticScope(tree.body, caret)
          || this.staticCandidates;   // If it fails, use the previous version.
    }
  } catch (e) { return null; }
}

JS.prototype.updateStaticCache = updateStaticCache;

function getStaticScope(tree, caret) {
  var subnode, symbols;
  var store = new TypeStore();

  var node = tree;
  var stack = [];
  var index = 0;
  var indices = [];
  var deeper = null;
  do {
    deeper = null;
    for (; index < node.length; index++) {
      subnode = node[index];
      while (["ReturnStatement", "VariableDeclarator", "ExpressionStatement",
              "AssignmentExpression", "Property"].indexOf(subnode.type) >= 0) {
        if (subnode.type == "ReturnStatement") {
          subnode = subnode.argument;
        }
        if (subnode.type == "VariableDeclarator") {
          // var foo = something;
          // Variable names go one level too deep.
          typeFromAssignment(store, [subnode.id.name], subnode.init,
              stack.length);  // weight
          if (!!subnode.init) {
            subnode = subnode.init;
          }
          else break;
        }
        if (subnode.type == "ExpressionStatement") {
          subnode = subnode.expression;  // Parenthesized expression.
        }
        if (subnode.type == "AssignmentExpression") {
          // foo.bar = something;
          if (subnode.left.type === "MemberExpression") {
            symbols = typeFromMember(store, subnode.left);
          } else { symbols = [subnode.left.name]; }
          typeFromAssignment(store, symbols, subnode.right, stack.length);
          subnode = subnode.right;       // f.g = function(){…};
        }
        if (subnode.type == "Property") {
          subnode = subnode.value;       // {f: function(){…}};
        }
      }
      if (subnode.type == "CallExpression") {
        typeFromCall(store, subnode, stack.length);
      }
      if (subnode.type == "FunctionDeclaration" ||
          subnode.type == "FunctionExpression" ||
          // Expressions, eg, (function(){…}());
          (subnode.callee && subnode.callee.type == "FunctionExpression")) {
        if (subnode.callee) {
          subnode = subnode.callee;
        }
        if (subnode.id) {
          store.addProperty(subnode.id.name,
              { name: 'Function', index: 0 },
              stack.length);
          readFun(store, subnode);
        }
        if (caretInBlock(subnode, caret)) {
          // Parameters are one level deeper than the function's name itself.
          argumentNames(subnode.params, store, stack.length + 1);
        }
      }
      deeper = nestedNodes(subnode, caret);
      if (!!deeper) {
        // We need to go deeper.
        stack.push(node);
        node = deeper;
        indices.push(index + 1);
        index = 0;
        break;
      } else deeper = null;
    }
    if (!deeper) {
      node = stack.pop();
      index = indices.pop();
    }
  } while (stack.length > 0 || (node && index < node.length) || !!deeper);

  return store;
}

//
// Find a parse node to iterate over, as the node's array.
// Can also return null if it gets unhappy.
//
// Parameters:
// - node: an AST parse tree node.
// - caret: an object {line:0, ch:0} containing the 0-indexed position of the
//   line and column of the caret.
//
function nestedNodes(node, caret) {
  var body = null;
  var newScope = true;  // Whether we enter a new scope.
  if (node.body) {
    if (node.body.body) {
      // Function declaration has a body in a body.
      body = node.body.body;
    } else {
      body = node.body;
    }
  } else if (node.consequent) {
    body = fakeIfNodeList(node);  // If statements.
  } else if (node.block) {
    body = node.block.body;       // Try statements.
  } else if (node.handlers) {     // Try/catch.
    body = node.handlers.body.body;
  } else if (node.finalizer) {
    body = node.finalizer.body;   // Try/catch/finally.
  } else if (node.declarations) {
    body = node.declarations;     // Variable declarations.
    newScope = false;
  } else if (node.arguments) {
    body = node.arguments;   // Function calls, eg, f(function(){…});
  } else if (node.properties) {
    body = node.properties;  // Objects, eg, ({f: function(){…}});
  } else if (node.elements) {
    body = node.elements;    // Array, eg, [function(){…}]
  }
  if (!body ||
      // No need to parse a scope in which the caret is not.
      (newScope && !caretInBlock(node, caret))) {
    return null;
  }
  return body;
}

//
// Construct a list of nodes to go through based on the sequence of ifs and else
// ifs and elses.
//
// Parameters:
// - node: an AST node of type IfStatement.
function fakeIfNodeList(node) {
  var body = [node.consequent];
  if (node.alternate) {
    if (node.alternate.type === "IfStatement") {
      body = body.concat(fakeIfNodeList(node.alternate));
    } else if (node.alternate.type === "BlockStatement") {
      body.push(node.alternate);
    }
  }
  return body;
}

//
// Whether the caret is in the piece of code represented by the node.
//
// Parameters:
//  - node: the parse tree node in which the caret might be.
//  - caret: the line and column where the caret is (both 0-indexed).
//
function caretInBlock(node, caret) {
  // Note that the AST's line number is 1-indexed.
  var astStartLine = node.loc.start.line - 1;
  var astEndLine = node.loc.end.line - 1;
  return (
    // The node starts before the cursor.
    (astStartLine - 1 < caret.line ||
     (astStartLine === caret.line &&
      node.loc.start.column <= caret.ch)) &&
    // The node ends after the cursor.
    (caret.line < astEndLine ||
     (astEndLine === caret.line &&
      caret.ch <= node.loc.end.column)));
}

//
// Get the argument names of a function.
//
// Parameters:
// - node: the "params" property of a FunctionExpression.
// - store: a Map where we store the information that an identifier exists and
//   has the given weight.
// - weight: an integer measure of how deeply nested the node is. The deeper,
//   the bigger.
//
function argumentNames(node, store, weight) {
  for (var i = 0; i < node.length; i++) {
    store.addProperty(node[i].name, null, weight);
  }
}



//
// Type inference.

// A type is a list of sources.
//
// *Sources* can be either:
//
// - The result of a `new Constructor()` call.
// - The result of a function.
// - A parameter to a function.
//
// Each function stores information in the TypeStore about all possible sources
// it can give, as a list of sources (aka typestores to all properties):
//
//     [`this` properties, return properties, param1, param2, etc.]
//
// Each instance stores information about the list of sources it may come from.
// Inferred information about the properties of each instance comes from the
// aggregated properties of each source.
// The type is therefore a map of the following form.
//
//      { "name of the original function": [list of indices of source] }
//
// We may represent atomic type outside a compound type as the following:
//
//      { name: "name of the origin", index: source index }
//

// A type inference instance maps symbols to an object of the following form:
//  - properties: a Map from property symbols to typeStores for its properties,
//  - type: a structural type (ie, not atomic) (see above).
//  - weight: integer, relevance of the symbol,
function TypeStore(type, weight) {
  this.properties = new Map();
  this.type = type || new Map();
  this.weight = weight|0;
  if (this.type.has("Function")) {
    // The sources for properties on `this` and on the return object.
    this.sources = [new TypeStore(), new TypeStore()];
  }
}

TypeStore.prototype = {
  // Add a property named `symbol` typed from the atomic type `atype`.
  // `atype` and `weight` may not be present.
  addProperty: function(symbol, atype, weight) {
    if (!this.properties.has(symbol)) {
      if (atype != null) {
        var newType = new Map();
        var typeSources = [atype.index];
        newType.set(atype.name, typeSources);
      }
      this.properties.set(symbol, new TypeStore(newType, weight));
    } else {
      // The weight is proportional to the frequency.
      var p = this.properties.get(symbol);
      p.weight++;   // FIXME: this increment is questionnable.
      if (atype != null) {
        p.addType(atype);
      }
    }
  },

  // Get a property. If inexistent, creates it.
  // Same parameters as `addProperty`.
  getOrSet: function(prop, atype, weight) {
    if (!this.properties.has(prop)) {
      this.addProperty(prop, atype, weight);
    } else if (!!atype) {
      this.properties.get(prop).addType(atype);
    }
    return this.properties.get(prop);
  },

  // Given an atomic type (name, index), is this one?
  hasType: function(atype) {
    if (!this.type.has(atype.name)) { return false; }
    return this.type.get(atype.name).indexOf(atype.index) >= 0;
  },

  // We can add an atomic type (a combination of the name of the original
  // function and the source index) to an existing compound type.
  addType: function(atype) {
    if (atype.name === "Function") {
      // The sources for properties on `this` and on the return object.
      this.sources = this.sources || [new TypeStore(), new TypeStore()];
    }
    if (this.type.has(atype.name)) {
      // The original function name is already known.
      var sourceIndices = this.type.get(atype.name);
      if (sourceIndices.indexOf(atype.index) === -1) {
        sourceIndices.push(atype.index);
      }
    } else {
      // New original function name (common case).
      var sourceIndices = [];
      sourceIndices.push(atype.index);
      this.type.set(atype.name, sourceIndices);
    }
  },

  // Add a compound type.
  // type: { "Constructor": [0] } (a Map).
  addTypes: function(type) {
    var that = this;
    type.forEach(function(value, key) {
      for (var i = 0; i < value.length; i++) {
        that.addType({ name: key, index: value[i] });
      }
    });
  }
};

// funcStore is the typeStore of the containing function.
// node is a MemberExpression.
// Returns a list of identifier elements.
function typeFromThis(funcStore, node) {
  var symbols, symbol, i;
  symbols = [];
  symbol = '';
  while (node.object &&   // `foo()` doesn't have a `.object`.
         node.object.type !== "Identifier" &&
         node.object.type !== "ThisExpression") {
    symbols.push(node.property.name);
    node = node.object;
  }
  if (node.property === undefined) { return []; }
  symbols.push(node.property.name);
  if (node.object.type === "ThisExpression") {
    // Add the `this` properties to the function's generic properties.
    for (i = symbols.length - 1; i >= 0; i--) {
      symbol = symbols[i];
      funcStore.sources[0].addProperty(symbol,
          {name:"Object", index:0}, funcStore.weight);
      funcStore = funcStore.properties.get(symbol);
    }
    return symbols;
  }
}

// Store is a TypeStore instance,
// node is a MemberExpression.
function typeFromMember(store, node) {
  var symbols, symbol, i;
  symbols = [];
  symbol = '';
  while (node.object &&   // `foo()` doesn't have a `.object`.
         node.object.type !== "Identifier" &&
         node.object.type !== "ThisExpression") {
    symbols.push(node.property.name);
    node = node.object;
  }
  if (node.property === undefined) { return []; }
  symbols.push(node.property.name);
  if (node.object.type !== "ThisExpression") {
    symbols.push(node.object.name);  // At this point, node is an identifier.
  } else {
    // Treat `this` as a variable inside the function.
    symbols.push("this");
  }

  // Now that we have the symbols, put them in the store.
  symbols.reverse();
  for (i = 0; i < symbols.length; i++) {
    symbol = symbols[i];
    store.addProperty(symbol);
    store = store.properties.get(symbol);
  }
  return symbols;
}

// Store is a TypeStore instance,
// node is a Literal or an ObjectExpression.
function typeFromLiteral(store, symbols, node) {
  var property, i, substore, nextSubstore;
  substore = store;
  // Find the substore insertion point.
  for (i = 0; i < symbols.length; i++) {
    nextSubstore = substore.properties.get(symbols[i]);
    if (!nextSubstore) {
      // It really should exist.
      substore.addProperty(symbols[i]);
      nextSubstore = substore.properties.get(symbols[i]);
    }
    substore = nextSubstore;
  }
  // Add the symbols.
  var constructor = "Object";
  if (node.type === "ObjectExpression") {
    for (i = 0; i < node.properties.length; i++) {
      property = node.properties[i];
      var propname = property.key.name? property.key.name
                           : property.key.value;
      substore.addProperty(propname);
      if (property.value.type === "ObjectExpression") {
        // We can recursively complete the object tree.
        typeFromLiteral(store, symbols.concat(propname), property.value);
      }
    }
  } else if (node.type === "ArrayExpression") {
    constructor = 'Array';
  } else if (node.value instanceof RegExp) {
    constructor = 'RegExp';
  } else if (typeof node.value === "number") {
    constructor = 'Number';
  } else if (typeof node.value === "string") {
    constructor = 'String';
  } else if (typeof node.value === "boolean") {
    constructor = 'Boolean';
  }
  substore.addType({ name: constructor, index: 0 });
}

// store: a TypeStore
// symbols: a list of Strings representing the assignee,
//          eg. `foo.bar` → ['foo','bar']
// node: the AST node representing the assigned. May be null.
// weight: a Number, representing the depth of the scope.
// FIXME: deal with assignments like `foo().bar = baz`
// (requires a modification in `symbols`' generators).
function typeFromAssignment(store, symbols, node, weight) {
  var property, i, substore, nextSubstore, lastSymbol;
  lastSymbol = symbols[symbols.length - 1];
  if (lastSymbol === undefined) { return; }
  substore = store;
  // Find the substore insertion point.
  // The last symbol will be added separately.
  for (i = 0; i < symbols.length - 1; i++) {
    nextSubstore = substore.properties.get(symbols[i]);
    if (!nextSubstore) {
      // It really should exist.
      substore.addProperty(symbols[i]);
      nextSubstore = substore.properties.get(symbols[i]);
    }
    substore = nextSubstore;
  }
  // What is on the right?
  if (!node) {
    // nothing.
    store.addProperty(lastSymbol, null, weight);
    return;
  }
  if (node.type === "NewExpression") {
    substore.addProperty(lastSymbol,    // property name
        { name: node.callee.name,       // atomic type
          index: 0 },                   // created from `new C()`
        weight);                        // weight
    // FIXME: the following might be inaccurate if the constructor isn't global
    store.addProperty(node.callee.name, { name: 'Function', index: 0 });
  } else if (node.type === "Literal" ||
             node.type === "ObjectExpression" ||
             node.type === "ArrayExpression") {
    // FIXME substore gets computed twice (once more in typeFromLiteral).
    typeFromLiteral(store, symbols, node);
    substore.properties.get(lastSymbol).weight = weight;
  } else if (node.type === "CallExpression") {
    typeFromCall(store, node, weight, lastSymbol, substore);
  } else if (node.type === "FunctionExpression") {
    // `var foo = function ?() {}`.
    var typeFunc = new Map;
    typeFunc.set("Function", [0]);
    var funcStore = new TypeStore(typeFunc);
    funcType(store, node, funcStore);
    store.properties.set(lastSymbol, funcStore);
  } else {
    // Simple object.
    store.addProperty(lastSymbol, null, weight);
  }
}

// Process a call expression.
// `node` is that AST CallExpression.
// `store` is the TypeStore to put it in.
// If that call is set to a property, `setstore` refers to the TypeStore wherein
// to put the type information, and `setsymbol` to the symbol set to that.
function typeFromCall(store, node, weight, setsymbol, setstore) {
  if (node.callee.name) {  // var foo = bar()
    store.addProperty(node.callee.name,
        { name: 'Function', index: 0 },
        weight);
    // Parameters
    for (var i = 0; i < node.arguments.length; i++) {
      store.getOrSet(node.arguments[i].name,
          { name: node.callee.name, index: 2 + i },
          weight);
    }
    if (setstore) {
      // Return type (eg, var foo = bar())
      setstore.addProperty(setsymbol,
          { name: node.callee.name,     // bar
            index: 1 },                 // created from `bar()`
          weight);
    }
  } else if (!node.callee.body) {  // f.g()
    typeFromMember(store, node.callee);
    // FIXME: make the last one (eg, `g`) a function.
  } else if (node.callee.type === "FunctionExpression") {
    // var foo = function(){} ()
    var typeFunc = new Map();
    typeFunc.set("Function", [0]);
    var funcStore = new TypeStore(typeFunc);
    funcType(store, node.callee, funcStore);
    // Its type is that of the return type of the function called.
    if (setstore) {
      // FIXME: don't override, add the properties.
      setstore.properties.set(setsymbol, funcStore.sources[1]);
    }
  }
}


//
// Assumes that the function has an explicit name (node.id.name).
//
// node is a named function declaration / expression.
function readFun(store, node) {
  var funcStore = store.properties.get(node.id.name);
  funcType(store, node, funcStore);
}

// node is a named function declaration / expression.
function funcType(store, node, funcStore) {
  var statements = node.body.body;
  var returnStore, returnCaret;
  for (var i = 0; i < statements.length; i++) {
    if (statements[i].expression &&
        statements[i].expression.type === "AssignmentExpression" &&
        statements[i].expression.left.type === "MemberExpression") {
      // Member expression like `this.bar = …`.
      typeFromThis(funcStore, statements[i].expression.left);

    } else if (statements[i].type === "ReturnStatement") {
      // Return statement, like `return {foo:bar}`.

      if (statements[i].argument.type === "Literal" ||
          statements[i].argument.type === "ObjectExpression") {
        // The source at index 1 is that for the returned object.
        typeFromLiteral(funcStore.sources[1], [], statements[i].argument);

      } else if (statements[i].argument.type === "Identifier") {
        // Put a caret after the return statement and get the scope.
        returnCaret = { line: statements[i].loc.end.line - 1,
                        ch: statements[i].loc.end.column };
        returnStore = getStaticScope(node.body.body, returnCaret);
        var returnEl = returnStore.properties.get(statements[i].argument.name);
        if (returnEl) {
          returnEl.properties.forEach(function(value, key) {
            funcStore.sources[1].properties.set(key, value);
          });
          funcStore.sources[1].addTypes(returnEl.type);
        }
      }
    }
  }
  if (returnStore === undefined) {
    // There was no return statement. Therefore, no store either.
    returnStore = new TypeStore();
    if (statements.length > 0) {
      returnCaret = { line: statements[statements.length-1].loc.end.line - 1,
                      ch: statements[statements.length-1].loc.end.column };
    } else {
      returnCaret = { line: node.body.loc.end.line - 1,
                      ch: node.body.loc.end.column };
    }
    returnStore = getStaticScope(node.body.body, returnCaret);
  }
  for (var i = 0; i < node.params.length; i++) {
    if (node.params[i].name) {
      funcStore.sources[2 + i] =
        returnStore.properties.get(node.params[i].name);
    }
  }
}
// Sandbox-based analysis.
//

// Return a sorted Completion (see entrance/completers.js).
//  - candidateFromDisplay: Map from display string to candidate.
//  - candidates: A list of candidates:
//    * display: a string of what the user sees.
//    * prefix: a string of what is added when the user chooses this.
//    * score: a number to grade the candidate.
//
// Parameters:
//  - global: an Object in which to search.
//  - context: {completion: number, data: array}
//    We assume completion to be either identifier or property.
//    See ./main.js.
function identifierLookup(global, context) {
  var matchProp = '';
  var completion = new Completion();

  var value = global;
  var symbols;
  if (context.completing === Completing.identifier ||  // foo.ba|
      context.completing === Completing.property) {    // foo.|
    symbols = context.data;
    if (context.completing === Completing.identifier) {
      symbols = context.data.slice(0, -1);
      matchProp = context.data[context.data.length - 1];
    }
    for (var i = 0; i < symbols.length; i++) {
      var descriptor = getPropertyDescriptor(value, symbols[i]);
      if (descriptor && descriptor.get) {
        // This is a getter / setter.
        // We might trigger a side-effect by going deeper.
        // We must stop before the world blows up in a Michael Bay manner.
        value = null;
        break;
      } else {
        // We need to go deeper. One property deeper.
        value = value[symbols[i]];
        if (value == null) { break; }
      }
    }
    this.dynAnalysisFromType(completion, symbols, global, matchProp);

  } else if (context.completing === Completing.string) {
    // "foo".|
    value = global.String.prototype;
  } else if (context.completing === Completing.regex) {
    // /foo/.|
    value = global.RegExp.prototype;
  }

  if (value != null) {
    completionFromValue(completion, value, matchProp);
  }
  return completion;
}

JS.prototype.identifierLookup = identifierLookup;

// completion: a Completion object,
// symbols: a list of strings of properties.
// global: a JS global object.
// matchProp: the start of the property name to complete.
function dynAnalysisFromType(completion, symbols, global, matchProp) {
  var store = this.staticCandidates;
  for (var i = 0; i < symbols.length; i++) {
    if (!store) { return; }
    store = store.properties.get(symbols[i]);
  }
  // Get the type of this property.
  if (!!store) {
    store.type.forEach(function(sourceIndices, funcName) {
      // The element is an instance of that class (source index = 0).
      if (sourceIndices.indexOf(0) >= 0 && global[funcName]) {
        completionFromValue(completion, global[funcName].prototype, matchProp);
      }
    });
  }
}

JS.prototype.dynAnalysisFromType = dynAnalysisFromType;

// completion: a Completion object,
// value: a JS object
// matchProp: a string of the start of the property to complete.
function completionFromValue(completion, value, matchProp) {
  var matchedProps = getMatchedProps(value, { matchProp: matchProp });
  for (var prop in matchedProps) {
    // It needs to be a valid property: this is dot completion.
    try {
      var tokens = esprima.tokenize(prop);
      if (tokens.length === 1 && tokens[0].type === "Identifier") {
        completion.insert(
            new Candidate(prop, matchProp, -1));
      }
    } catch (e) {} // Definitely not a valid property.
  }
}


// Get all accessible properties on this JS value, as an Object.
// Filter those properties by name.
// Take only a certain number of those.
//
// Parameters:
//  - obj: JS value whose properties we want to collect.
//  - options: Options that the algorithm takes.
//    * matchProp (string): Filter for properties that match this one.
//      Defaults to the empty string (which always matches).
//    * max (number): Limit the number of properties.
function getMatchedProps(obj, options) {
  // Argument defaults.
  options = options || {};
  options.matchProp = options.matchProp || "";
  options.max = options.max || Infinity;

  if (obj == null) {
    return {};
  }

  try {
    Object.getPrototypeOf(obj);
  } catch(e) {
    obj = obj.constructor.prototype;
  }
  var c = options.max;
  var names = Object.create(null);   // Using an Object to avoid duplicates.

  // We need to go up the prototype chain.
  var ownNames = null;
  while (obj !== null) {
    ownNames = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < ownNames.length; i++) {
      // Filtering happens here.
      // If we already have it in, no need to append it.
      if (ownNames[i].indexOf(options.matchProp) != 0 ||
          ownNames[i] in names) {
        continue;
      }
      c--;
      if (c < 0) {
        return names;
      }
      // If it is an array index, we can't take it.
      // This uses a trick: converting a string to a number yields NaN if
      // the operation failed, and NaN is not equal to itself.
      if (+ownNames[i] != +ownNames[i]) {
        names[ownNames[i]] = true;
      }
    }
    obj = Object.getPrototypeOf(obj);
  }

  return names;
}

// Just like Object.getOwnPropertyDescriptor,
// but walks up the prototype tree.
function getPropertyDescriptor(obj, name) {
  try {
    Object.getPrototypeOf(obj);
  } catch(e) {
    obj = obj.constructor.prototype;
  }

  var descriptor;
  while (obj !== null) {
    descriptor = Object.getOwnPropertyDescriptor(obj, name);
    if (descriptor !== undefined) {
      return descriptor;
    }
    obj = Object.getPrototypeOf(obj);
  }
}
// The weight comes from keyword frequency data at
// http://ariya.ofilabs.com/2012/03/most-popular-javascript-keywords.html

var JSKeywords = (function(keywords) {
  var keywordWeights = {};
  for (var i = 0; i < keywords.length; i++) {
    // The first keyword has a weight of -2,
    // the second one of -3, etc.
    keywordWeights[keywords[i]] = - i - 2;
  }
  return keywordWeights;
}([
  "this",
  "function",
  "if",
  "return",
  "var",
  "let",
  "else",
  "for",
  "new",
  "in",
  "typeof",
  "while",
  "case",
  "break",
  "try",
  "catch",
  "delete",
  "throw",
  "switch",
  "continue",
  "default",
  "instanceof",
  "do",
  "void",
  "finally",

  // We do not have information about the following.
  // Also, true, false, null and undefined are not keywords stricto sensu,
  // but autocompleting them seems nicer.
  "true",
  "false",
  "null",
  "undefined",
  "class",
  "super",
  "import",
  "export",
  "get",
  "of",
  "set",
  "const",
  "with",
  "debugger"
]));
}(completer));

return exports;
}));
