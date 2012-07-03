Esprima ([esprima.org](http://esprima.org)) is an educational
[ECMAScript](http://www.ecma-international.org/publications/standards/Ecma-262.htm)
(also popularly known as [JavaScript](http://en.wikipedia.org/wiki/JavaScript>JavaScript))
parsing infrastructure for multipurpose analysis. It is also written in ECMAScript.

Esprima is created and maintained by [Ariya Hidayat](http://ariya.ofilabs.com/about)
(Twitter: [@ariyahidayat](http://twitter.com/ariyahidayat)), with the help of
[many contributors](https://github.com/ariya/esprima/contributors).

### Features

- Supports [ECMAScript 5.1](http://www.ecma-international.org/publications/standards/Ecma-262.htm)
with an experimental branch for ES.Next/Harmony
- Sensible format for the abstract syntax tree (AST), compatible with Mozilla
[Parser API](https://developer.mozilla.org/en/SpiderMonkey/Parser_API)
- Heavily tested (> 500 [unit tests](http://esprima.org/test/) with solid 100% code coverage)
- Optional tracking of syntax node location (index-based and line-column)
- [Blazing fast](http://esprima.org/test/benchmarks.html), up to 3x faster than
UglifyJS `parse-js` ([speed comparison](http://esprima.org/test/compare.html))

Esprima runs on web browsers (IE 6+, Firefox 1+, Safari 3+, Chrome 1+, Konqueror 4.6+, Opera 8+) as well as
[Node.js](http://nodejs.org).

### Use-cases

- Smart editing: [outline view](https://github.com/aclement/esprima-outline), [content assist](http://contraptionsforprogramming.blogspot.com/2012/02/better-javascript-content-assist-in.html)
- Source code modification: [Esmorph](https://github.com/ariya/esmorph), [Code Painter](https://github.com/fawek/codepainter),
  [node-falafel](https://github.com/substack/node-falafel)
- Code coverage analysis: [node-cover](https://github.com/itay/node-cover),
[coveraje](https://github.com/coveraje/coveraje),
[CoverJS](https://github.com/arian/CoverJS)
- Code generation: [escodegen](https://github.com/Constellation/escodegen)
- Documentation tool: [JFDoc](https://github.com/thejohnfreeman/jfdoc), [JSDuck](https://github.com/senchalabs/jsduck)
- Source-to-source compilation: [Marv](https://github.com/Yoric/Marv-the-Tinker),
[LLJS](http://mbebenita.github.com/LLJS/)


### Questions?
- [Documentation](http://esprima.org/doc)
- [Issue tracker](http://issues.esprima.org): [known problems](http://code.google.com/p/esprima/issues/list?q=Defect)
and [future plans](http://code.google.com/p/esprima/issues/list?q=Enhancement)
- [Mailing list](http://groups.google.com/group/esprima)
- [Contribution guide](http://esprima.org/doc/index.html#contribution)

Feedback and contribution are welcomed!

### License

Copyright (C) 2012, 2011 [Ariya Hidayat](http://ariya.ofilabs.com/about)
 and other contributors.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

