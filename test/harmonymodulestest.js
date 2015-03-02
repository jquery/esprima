/*
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2011 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2011 Arpad Borsos <arpad.borsos@googlemail.com>

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
*/

var modulesTestFixture = {

    // people.mozilla.org/~jorendorff/es6-draft.html
    'ES6: Modules': {
        // default exports
        'export default 42;': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'Literal',
                    value: 42,
                    raw: '42',
                    range: [15, 17],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 17 }
                    }
                },
                specifiers: [],
                source: null,
                range: [0, 18],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 18 }
                }
            }],
            range: [0, 18],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 18 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Numeric',
                value: '42',
                range: [15, 17],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 17 }
                }
            }, {
                type: 'Punctuator',
                value: ';',
                range: [17, 18],
                loc: {
                    start: { line: 1, column: 17 },
                    end: { line: 1, column: 18 }
                }
            }]
        },
        'export default function () {}': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'FunctionExpression',
                    id: null,
                    params: [],
                    defaults: [],
                    body: {
                        type: 'BlockStatement',
                        body: [],
                        range: [27, 29],
                        loc: {
                            start: { line: 1, column: 27 },
                            end: { line: 1, column: 29 }
                        }
                    },
                    rest: null,
                    generator: false,
                    expression: false,
                    range: [15, 29],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 29 }
                    }
                },
                specifiers: [],
                source: null,
                range: [0, 29],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 29 }
                }
            }],
            range: [0, 29],
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 29 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Keyword',
                value: 'function',
                range: [15, 23],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 23 }
                }
            }, {
                type: 'Punctuator',
                value: '(',
                range: [24, 25],
                loc: {
                    start: { line: 1, column: 24 },
                    end: { line: 1, column: 25 }
                }
            }, {
                type: 'Punctuator',
                value: ')',
                range: [25, 26],
                loc: {
                    start: { line: 1, column: 25 },
                    end: { line: 1, column: 26 }
                }
            }, {
                type: 'Punctuator',
                value: '{',
                range: [27, 28],
                loc: {
                    start: { line: 1, column: 27 },
                    end: { line: 1, column: 28 }
                }
            }, {
                type: 'Punctuator',
                value: '}',
                range: [28, 29],
                loc: {
                    start: { line: 1, column: 28 },
                    end: { line: 1, column: 29 }
                }
            }]
        },
        'export default function foo() {}': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'FunctionDeclaration',
                    id: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [24, 27],
                        loc: {
                            start: { line: 1, column: 24 },
                            end: { line: 1, column: 27 }
                        }
                    },
                    params: [],
                    defaults: [],
                    body: {
                        type: 'BlockStatement',
                        body: [],
                        range: [30, 32],
                        loc: {
                            start: { line: 1, column: 30 },
                            end: { line: 1, column: 32 }
                        }
                    },
                    rest: null,
                    generator: false,
                    expression: false,
                    range: [15, 32],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 32 }
                    }
                },
                specifiers: [{
                    type: 'Identifier',
                    name: 'foo',
                    range: [24, 27],
                    loc: {
                        start: { line: 1, column: 24 },
                        end: { line: 1, column: 27 }
                    }
                }],
                source: null,
                range: [0, 32],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 32 }
                }
            }],
            range: [0, 32],
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 32 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Keyword',
                value: 'function',
                range: [15, 23],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 23 }
                }
            }, {
                type: 'Identifier',
                value: 'foo',
                range: [24, 27],
                loc: {
                    start: { line: 1, column: 24 },
                    end: { line: 1, column: 27 }
                }
            }, {
                type: 'Punctuator',
                value: '(',
                range: [27, 28],
                loc: {
                    start: { line: 1, column: 27 },
                    end: { line: 1, column: 28 }
                }
            }, {
                type: 'Punctuator',
                value: ')',
                range: [28, 29],
                loc: {
                    start: { line: 1, column: 28 },
                    end: { line: 1, column: 29 }
                }
            }, {
                type: 'Punctuator',
                value: '{',
                range: [30, 31],
                loc: {
                    start: { line: 1, column: 30 },
                    end: { line: 1, column: 31 }
                }
            }, {
                type: 'Punctuator',
                value: '}',
                range: [31, 32],
                loc: {
                    start: { line: 1, column: 31 },
                    end: { line: 1, column: 32 }
                }
            }]
        },
        'export default class {}': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'ClassExpression',
                    superClass: null,
                    body: {
                        type: 'ClassBody',
                        body: [],
                        range: [21, 23],
                        loc: {
                            start: { line: 1, column: 21 },
                            end: { line: 1, column: 23 }
                        }
                    },
                    range: [15, 23],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 23 }
                    }
                },
                specifiers: [],
                source: null,
                range: [0, 23],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 23 }
                }
            }],
            range: [0, 23],
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 23 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Keyword',
                value: 'class',
                range: [15, 20],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 20 }
                }
            }, {
                type: 'Punctuator',
                value: '{',
                range: [21, 22],
                loc: {
                    start: { line: 1, column: 21 },
                    end: { line: 1, column: 22 }
                }
            }, {
                type: 'Punctuator',
                value: '}',
                range: [22, 23],
                loc: {
                    start: { line: 1, column: 22 },
                    end: { line: 1, column: 23 }
                }
            }]
        },
        'export default {};': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'ObjectExpression',
                    properties: [],
                    range: [15, 17],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 17 }
                    }
                },
                specifiers: [],
                source: null,
                range: [0, 18],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 18 }
                }
            }],
            range: [0, 18],
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 18 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Punctuator',
                value: '{',
                range: [15, 16],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 16 }
                }
            }, {
                type: 'Punctuator',
                value: '}',
                range: [16, 17],
                loc: {
                    start: { line: 1, column: 16 },
                    end: { line: 1, column: 17 }
                }
            }, {
                type: 'Punctuator',
                value: ';',
                range: [17, 18],
                loc: {
                    start: { line: 1, column: 17 },
                    end: { line: 1, column: 18 }
                }
            }]
        },
        'export default [];': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'ArrayExpression',
                    elements: [],
                    range: [15, 17],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 17 }
                    }
                },
                specifiers: [],
                source: null,
                range: [0, 18],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 18 }
                }
            }],
            range: [0, 18],
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 18 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Punctuator',
                value: '[',
                range: [15, 16],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 16 }
                }
            }, {
                type: 'Punctuator',
                value: ']',
                range: [16, 17],
                loc: {
                    start: { line: 1, column: 16 },
                    end: { line: 1, column: 17 }
                }
            }, {
                type: 'Punctuator',
                value: ';',
                range: [17, 18],
                loc: {
                    start: { line: 1, column: 17 },
                    end: { line: 1, column: 18 }
                }
            }]
        },
        'export default foo;': {
            type: 'Program',
            body: [{
                type: 'ExportDeclaration',
                'default': true,
                declaration: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [15, 18],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 18 }
                    }
                },
                specifiers: [],
                source: null,
                range: [0, 19],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 19 }
                }
            }],
            range: [0, 19],
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 19 }
            },
            tokens: [{
                type: 'Keyword',
                value: 'export',
                range: [0, 6],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 6 }
                }
            }, {
                type: 'Keyword',
                value: 'default',
                range: [7, 14],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 14 }
                }
            }, {
                type: 'Identifier',
                value: 'foo',
                range: [15, 18],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 18 }
                }
            }, {
                type: 'Punctuator',
                value: ';',
                range: [18, 19],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 19 }
                }
            }]
        },

        // variables exports
        'export var foo = 1;': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [11, 14],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 14 }
                        }
                    },
                    init: {
                        type: 'Literal',
                        value: 1,
                        raw: '1',
                        range: [17, 18],
                        loc: {
                            start: { line: 1, column: 17 },
                            end: { line: 1, column: 18 }
                        }
                    },
                    range: [11, 18],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 18 }
                    }
                }],
                kind: 'var',
                range: [7, 19],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 19 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 19],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 19 }
            }
        },
        'export var foo = function () {};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [11, 14],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 14 }
                        }
                    },
                    init: {
                        type: 'FunctionExpression',
                        id: null,
                        params: [],
                        defaults: [],
                        body: {
                            type: 'BlockStatement',
                            body: [],
                            range: [29, 31],
                            loc: {
                                start: { line: 1, column: 29 },
                                end: { line: 1, column: 31 }
                            }
                        },
                        rest: null,
                        generator: false,
                        expression: false,
                        range: [17, 31],
                        loc: {
                            start: { line: 1, column: 17 },
                            end: { line: 1, column: 31 }
                        }
                    },
                    range: [11, 31],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 31 }
                    }
                }],
                kind: 'var',
                range: [7, 32],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 32 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 32],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 32 }
            }
        },

        // lazy initialization
        'export var bar;': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'bar',
                        range: [11, 14],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 14 }
                        }
                    },
                    init: null,
                    range: [11, 14],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 14 }
                    }
                }],
                kind: 'var',
                range: [7, 15],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 15 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 15],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 15 }
            }
        },
        'export let foo = 2;': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [11, 14],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 14 }
                        }
                    },
                    init: {
                        type: 'Literal',
                        value: 2,
                        raw: '2',
                        range: [17, 18],
                        loc: {
                            start: { line: 1, column: 17 },
                            end: { line: 1, column: 18 }
                        }
                    },
                    range: [11, 18],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 18 }
                    }
                }],
                kind: 'let',
                range: [7, 19],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 19 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 19],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 19 }
            }
        },
        // lazy initialization
        'export let bar;': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'bar',
                        range: [11, 14],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 14 }
                        }
                    },
                    init: null,
                    range: [11, 14],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 14 }
                    }
                }],
                kind: 'let',
                range: [7, 15],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 15 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 15],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 15 }
            }
        },
        'export const foo = 3;': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [13, 16],
                        loc: {
                            start: { line: 1, column: 13 },
                            end: { line: 1, column: 16 }
                        }
                    },
                    init: {
                        type: 'Literal',
                        value: 3,
                        raw: '3',
                        range: [19, 20],
                        loc: {
                            start: { line: 1, column: 19 },
                            end: { line: 1, column: 20 }
                        }
                    },
                    range: [13, 20],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 20 }
                    }
                }],
                kind: 'const',
                range: [7, 21],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 21 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 21],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 21 }
            }
        },
        'export function foo () {}': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [16, 19],
                    loc: {
                        start: { line: 1, column: 16 },
                        end: { line: 1, column: 19 }
                    }
                },
                params: [],
                defaults: [],
                body: {
                    type: 'BlockStatement',
                    body: [],
                    range: [23, 25],
                    loc: {
                        start: { line: 1, column: 23 },
                        end: { line: 1, column: 25 }
                    }
                },
                rest: null,
                generator: false,
                expression: false,
                range: [7, 25],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 25 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 25],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 25 }
            }
        },
        'export class foo {}': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'ClassDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [13, 16],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 16 }
                    }
                },
                superClass: null,
                body: {
                    type: 'ClassBody',
                    body: [],
                    range: [17, 19],
                    loc: {
                        start: { line: 1, column: 17 },
                        end: { line: 1, column: 19 }
                    }
                },
                range: [7, 19],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 19 }
                }
            },
            specifiers: [],
            source: null,
            range: [0, 19],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 19 }
            }
        },

        // named exports
        'export {foo};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: null,
                range: [8, 11],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 11 }
                }
            }],
            source: null,
            range: [0, 13],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 13 }
            }
        },
        'export {foo, bar};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: null,
                range: [8, 11],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 11 }
                }
            }, {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [13, 16],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [13, 16],
                loc: {
                    start: { line: 1, column: 13 },
                    end: { line: 1, column: 16 }
                }
            }],
            source: null,
            range: [0, 18],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 18 }
            }
        },
        'export {foo as bar};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [15, 18],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 18 }
                    }
                },
                range: [8, 18],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 18 }
                }
            }],
            source: null,
            range: [0, 20],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 20 }
            }
        },
        'export {foo as default};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'default',
                    range: [15, 22],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 22 }
                    }
                },
                range: [8, 22],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 22 }
                }
            }],
            source: null,
            range: [0, 24],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 24 }
            }
        },
        'export {foo as default, bar};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'default',
                    range: [15, 22],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 22 }
                    }
                },
                range: [8, 22],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 22 }
                }
            }, {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [24, 27],
                    loc: {
                        start: { line: 1, column: 24 },
                        end: { line: 1, column: 27 }
                    }
                },
                name: null,
                range: [24, 27],
                loc: {
                    start: { line: 1, column: 24 },
                    end: { line: 1, column: 27 }
                }
            }],
            source: null,
            range: [0, 29],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 29 }
            }
        },

        // exports from
        'export * from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportBatchSpecifier',
                range: [7, 8],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 8 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [14, 19],
                loc: {
                    start: { line: 1, column: 14 },
                    end: { line: 1, column: 19 }
                }
            },
            range: [0, 20],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 20 }
            }
        },
        'export {foo} from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: null,
                range: [8, 11],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 11 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [18, 23],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 23 }
                }
            },
            range: [0, 24],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 24 }
            }
        },
        'export {foo, bar} from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: null,
                range: [8, 11],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 11 }
                }
            }, {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [13, 16],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [13, 16],
                loc: {
                    start: { line: 1, column: 13 },
                    end: { line: 1, column: 16 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [23, 28],
                loc: {
                    start: { line: 1, column: 23 },
                    end: { line: 1, column: 28 }
                }
            },
            range: [0, 29],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 29 }
            }
        },
        'export {foo as bar} from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [15, 18],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 18 }
                    }
                },
                range: [8, 18],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 18 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [25, 30],
                loc: {
                    start: { line: 1, column: 25 },
                    end: { line: 1, column: 30 }
                }
            },
            range: [0, 31],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 31 }
            }
        },
        'export {foo as default} from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'default',
                    range: [15, 22],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 22 }
                    }
                },
                range: [8, 22],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 22 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [29, 34],
                loc: {
                    start: { line: 1, column: 29 },
                    end: { line: 1, column: 34 }
                }
            },
            range: [0, 35],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 35 }
            }
        },
        'export {foo as default, bar} from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'default',
                    range: [15, 22],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 22 }
                    }
                },
                range: [8, 22],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 22 }
                }
            }, {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [24, 27],
                    loc: {
                        start: { line: 1, column: 24 },
                        end: { line: 1, column: 27 }
                    }
                },
                name: null,
                range: [24, 27],
                loc: {
                    start: { line: 1, column: 24 },
                    end: { line: 1, column: 27 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [34, 39],
                loc: {
                    start: { line: 1, column: 34 },
                    end: { line: 1, column: 39 }
                }
            },
            range: [0, 40],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 40 }
            }
        },
        'export {default} from "foo";': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'default',
                    range: [8, 15],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 15 }
                    }
                },
                name: null,
                range: [8, 15],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 15 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [22, 27],
                loc: {
                    start: { line: 1, column: 22 },
                    end: { line: 1, column: 27 }
                }
            },
            range: [0, 28],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 28 }
            }
        },

        // default imports
        'import foo from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportDefaultSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [7, 10],
                    loc: {
                        start: { line: 1, column: 7 },
                        end: { line: 1, column: 10 }
                    }
                },
                range: [7, 10],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 10 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [16, 21],
                loc: {
                    start: { line: 1, column: 16 },
                    end: { line: 1, column: 21 }
                }
            },
            range: [0, 22],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 22 }
            }
        },
        'import {default as foo} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'default',
                    range: [8, 15],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 15 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [19, 22],
                    loc: {
                        start: { line: 1, column: 19 },
                        end: { line: 1, column: 22 }
                    }
                },
                range: [8, 22],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 22 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [29, 34],
                loc: {
                    start: { line: 1, column: 29 },
                    end: { line: 1, column: 34 }
                }
            },
            range: [0, 35],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 35 }
            }
        },

        // named imports
        'import {bar} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: null,
                range: [8, 11],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 11 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [18, 23],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 23 }
                }
            },
            range: [0, 24],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 24 }
            }
        },
        'import {bar, baz} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: null,
                range: [8, 11],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 11 }
                }
            }, {
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'baz',
                    range: [13, 16],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [13, 16],
                loc: {
                    start: { line: 1, column: 13 },
                    end: { line: 1, column: 16 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [23, 28],
                loc: {
                    start: { line: 1, column: 23 },
                    end: { line: 1, column: 28 }
                }
            },
            range: [0, 29],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 29 }
            }
        },
        'import {bar as baz} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'baz',
                    range: [15, 18],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 18 }
                    }
                },
                range: [8, 18],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 18 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [25, 30],
                loc: {
                    start: { line: 1, column: 25 },
                    end: { line: 1, column: 30 }
                }
            },
            range: [0, 31],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 31 }
            }
        },
        'import {bar as baz, xyz} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [8, 11],
                    loc: {
                        start: { line: 1, column: 8 },
                        end: { line: 1, column: 11 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'baz',
                    range: [15, 18],
                    loc: {
                        start: { line: 1, column: 15 },
                        end: { line: 1, column: 18 }
                    }
                },
                range: [8, 18],
                loc: {
                    start: { line: 1, column: 8 },
                    end: { line: 1, column: 18 }
                }
            }, {
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'xyz',
                    range: [20, 23],
                    loc: {
                        start: { line: 1, column: 20 },
                        end: { line: 1, column: 23 }
                    }
                },
                name: null,
                range: [20, 23],
                loc: {
                    start: { line: 1, column: 20 },
                    end: { line: 1, column: 23 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [30, 35],
                loc: {
                    start: { line: 1, column: 30 },
                    end: { line: 1, column: 35 }
                }
            },
            range: [0, 36],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 36 }
            }
        },

        // glob imports
        'import * as foo from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportNamespaceSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [12, 15],
                    loc: {
                        start: { line: 1, column: 12 },
                        end: { line: 1, column: 15 }
                    }
                },
                range: [7, 15],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 15 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [21, 26],
                loc: {
                    start: { line: 1, column: 21 },
                    end: { line: 1, column: 26 }
                }
            },
            range: [0, 27],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 27 }
            }
        },

        // just import
        'import "foo";': {
            type: 'ImportDeclaration',
            specifiers: [],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [7, 12],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 12 }
                }
            },
            range: [0, 13],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 13 }
            }
        },

        // mixins
        'import foo, {bar} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportDefaultSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [7, 10],
                    loc: {
                        start: { line: 1, column: 7 },
                        end: { line: 1, column: 10 }
                    }
                },
                range: [7, 10],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 10 }
                }
            }, {
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [13, 16],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [13, 16],
                loc: {
                    start: { line: 1, column: 13 },
                    end: { line: 1, column: 16 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [23, 28],
                loc: {
                    start: { line: 1, column: 23 },
                    end: { line: 1, column: 28 }
                }
            },
            range: [0, 29],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 29 }
            }
        },

        // mixins
        'import foo, * as bar from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportDefaultSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [7, 10],
                    loc: {
                        start: { line: 1, column: 7 },
                        end: { line: 1, column: 10 }
                    }
                },
                range: [7, 10],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 10 }
                }
            }, {
                type: 'ImportNamespaceSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'bar',
                    range: [17, 20],
                    loc: {
                        start: { line: 1, column: 17 },
                        end: { line: 1, column: 20 }
                    }
                },
                range: [12, 20],
                loc: {
                    start: { line: 1, column: 12 },
                    end: { line: 1, column: 20 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [26, 31],
                loc: {
                    start: { line: 1, column: 26 },
                    end: { line: 1, column: 31 }
                }
            },
            range: [0, 32],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 32 }
            }
        },

        // legacy tests from harmonytest.js
        'export var document': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'document',
                        range: [ 11, 19 ],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 19 }
                        }
                    },
                    init: null,
                    range: [ 11, 19 ],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 19 }
                    }
                }],
                kind: 'var',
                range: [ 7, 19 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 19 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 19 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 19 }
            }
        },

        'export var document = { }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'document',
                        range: [ 11, 19 ],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 19 }
                        }
                    },
                    init: {
                        type: 'ObjectExpression',
                        properties: [],
                        range: [ 22, 25 ],
                        loc: {
                            start: { line: 1, column: 22 },
                            end: { line: 1, column: 25 }
                        }
                    },
                    range: [ 11, 25 ],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 25 }
                    }
                }],
                kind: 'var',
                range: [ 7, 25 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 25 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 25 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 25 }
            }
        },

        'export let document': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'document',
                        range: [ 11, 19 ],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 19 }
                        }
                    },
                    init: null,
                    range: [ 11, 19 ],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 19 }
                    }
                }],
                kind: 'let',
                range: [ 7, 19 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 19 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 19 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 19 }
            }
        },

        'export let document = { }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'document',
                        range: [ 11, 19 ],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 19 }
                        }
                    },
                    init: {
                        type: 'ObjectExpression',
                        properties: [],
                        range: [ 22, 25 ],
                        loc: {
                            start: { line: 1, column: 22 },
                            end: { line: 1, column: 25 }
                        }
                    },
                    range: [ 11, 25 ],
                    loc: {
                        start: { line: 1, column: 11 },
                        end: { line: 1, column: 25 }
                    }
                }],
                kind: 'let',
                range: [ 7, 25 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 25 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 25 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 25 }
            }
        },

        'export const document = { }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'document',
                        range: [ 13, 21 ],
                        loc: {
                            start: { line: 1, column: 13 },
                            end: { line: 1, column: 21 }
                        }
                    },
                    init: {
                        type: 'ObjectExpression',
                        properties: [],
                        range: [ 24, 27 ],
                        loc: {
                            start: { line: 1, column: 24 },
                            end: { line: 1, column: 27 }
                        }
                    },
                    range: [ 13, 27 ],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 27 }
                    }
                }],
                kind: 'const',
                range: [ 7, 27 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 27 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 27 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 27 }
            }
        },

        'export function parse() { }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'parse',
                    range: [ 16, 21 ],
                    loc: {
                        start: { line: 1, column: 16 },
                        end: { line: 1, column: 21 }
                    }
                },
                params: [],
                defaults: [],
                body: {
                    type: 'BlockStatement',
                    body: [],
                    range: [ 24, 27 ],
                    loc: {
                        start: { line: 1, column: 24 },
                        end: { line: 1, column: 27 }
                    }
                },
                rest: null,
                generator: false,
                expression: false,
                range: [ 7, 27 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 27 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 27 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 27 }
            }
        },

        'export class Class {}': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: {
                type: 'ClassDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'Class',
                    range: [ 13, 18 ],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 18 }
                    }
                },
                superClass: null,
                body: {
                    type: 'ClassBody',
                    body: [],
                    range: [ 19, 21 ],
                    loc: {
                        start: { line: 1, column: 19 },
                        end: { line: 1, column: 21 }
                    }
                },
                range: [ 7, 21 ],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 21 }
                }
            },
            specifiers: [],
            source: null,
            range: [ 0, 21 ],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 21 }
            }
        },

        'export * from "crypto"': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportBatchSpecifier',
                range: [7, 8],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 8 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'crypto',
                raw: '"crypto"',
                range: [14, 22],
                loc: {
                    start: { line: 1, column: 14 },
                    end: { line: 1, column: 22 }
                }
            },
            range: [0, 22],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 22 }
            }
        },

        'export { encrypt }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [9, 16],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 16 }
                }
            }],
            source: null,
            range: [0, 18],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 18 }
            }
        },

        'export { encrypt, decrypt }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [9, 16],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 16 }
                }
            }, {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'decrypt',
                    range: [18, 25],
                    loc: {
                        start: { line: 1, column: 18 },
                        end: { line: 1, column: 25 }
                    }
                },
                name: null,
                range: [18, 25],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 25 }
                }
            }],
            source: null,
            range: [0, 27],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 27 }
            }
        },

        'export { encrypt as default }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'default',
                    range: [20, 27],
                    loc: {
                        start: { line: 1, column: 20 },
                        end: { line: 1, column: 27 }
                    }
                },
                range: [9, 27],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 27 }
                }
            }],
            source: null,
            range: [0, 29],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 29 }
            }
        },

        'export { encrypt, decrypt as dec }': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [{
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [9, 16],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 16 }
                }
            }, {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'decrypt',
                    range: [18, 25],
                    loc: {
                        start: { line: 1, column: 18 },
                        end: { line: 1, column: 25 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'dec',
                    range: [29, 32],
                    loc: {
                        start: { line: 1, column: 29 },
                        end: { line: 1, column: 32 }
                    }
                },
                range: [18, 32],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 32 }
                }
            }],
            source: null,
            range: [0, 34],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 34 }
            }
        },

        'import "jquery"': {
            type: 'ImportDeclaration',
            specifiers: [],
            source: {
                type: 'Literal',
                value: 'jquery',
                raw: '"jquery"',
                range: [7, 15],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 15 }
                }
            },
            range: [0, 15],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 15 }
            }
        },

        'import $ from "jquery"': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportDefaultSpecifier',
                id: {
                    type: 'Identifier',
                    name: '$',
                    range: [7, 8],
                    loc: {
                        start: { line: 1, column: 7 },
                        end: { line: 1, column: 8 }
                    }
                },
                range: [7, 8],
                loc: {
                    start: { line: 1, column: 7 },
                    end: { line: 1, column: 8 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'jquery',
                raw: '"jquery"',
                range: [14, 22],
                loc: {
                    start: { line: 1, column: 14 },
                    end: { line: 1, column: 22 }
                }
            },
            range: [0, 22],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 22 }
            }
        },

        'import { encrypt, decrypt } from "crypto"': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [9, 16],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 16 }
                }
            }, {
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'decrypt',
                    range: [18, 25],
                    loc: {
                        start: { line: 1, column: 18 },
                        end: { line: 1, column: 25 }
                    }
                },
                name: null,
                range: [18, 25],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 25 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'crypto',
                raw: '"crypto"',
                range: [33, 41],
                loc: {
                    start: { line: 1, column: 33 },
                    end: { line: 1, column: 41 }
                }
            },
            range: [0, 41],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 41 }
            }
        },

        'import { encrypt as enc } from "crypto"': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'enc',
                    range: [20, 23],
                    loc: {
                        start: { line: 1, column: 20 },
                        end: { line: 1, column: 23 }
                    }
                },
                range: [9, 23],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 23 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'crypto',
                raw: '"crypto"',
                range: [31, 39],
                loc: {
                    start: { line: 1, column: 31 },
                    end: { line: 1, column: 39 }
                }
            },
            range: [0, 39],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 39 }
            }
        },

        'import { decrypt, encrypt as enc } from "crypto"': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'decrypt',
                    range: [9, 16],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 16 }
                    }
                },
                name: null,
                range: [9, 16],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 16 }
                }
            }, {
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'encrypt',
                    range: [18, 25],
                    loc: {
                        start: { line: 1, column: 18 },
                        end: { line: 1, column: 25 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'enc',
                    range: [29, 32],
                    loc: {
                        start: { line: 1, column: 29 },
                        end: { line: 1, column: 32 }
                    }
                },
                range: [18, 32],
                loc: {
                    start: { line: 1, column: 18 },
                    end: { line: 1, column: 32 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'crypto',
                raw: '"crypto"',
                range: [40, 48],
                loc: {
                    start: { line: 1, column: 40 },
                    end: { line: 1, column: 48 }
                }
            },
            range: [0, 48],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 48 }
            }
        },

        'import { null as nil } from "bar"': {
            type: 'ImportDeclaration',
            specifiers: [{
                type: 'ImportSpecifier',
                id: {
                    type: 'Identifier',
                    name: 'null',
                    range: [9, 13],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 13 }
                    }
                },
                name: {
                    type: 'Identifier',
                    name: 'nil',
                    range: [17, 20],
                    loc: {
                        start: { line: 1, column: 17 },
                        end: { line: 1, column: 20 }
                    }
                },
                range: [9, 20],
                loc: {
                    start: { line: 1, column: 9 },
                    end: { line: 1, column: 20 }
                }
            }],
            source: {
                type: 'Literal',
                value: 'bar',
                raw: '"bar"',
                range: [28, 33],
                loc: {
                    start: { line: 1, column: 28 },
                    end: { line: 1, column: 33 }
                }
            },
            range: [0, 33],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 33 }
            }
        }
    },

    'Modules Invalid Syntax': {
        // Module top-levels are implicitly "use strict"
        'with(someObj) {}': {
            index: 0,
            lineNumber: 1,
            column: 1,
            message: "Error: Line 1: Strict mode code may not include a with statement"
        },

        'import foo': {
            index: 10,
            lineNumber: 1,
            column: 11,
            message: 'Error: Line 1: Missing from clause'
        },

        'import { foo, bar }': {
            index: 19,
            lineNumber: 1,
            column: 20,
            message: 'Error: Line 1: Missing from clause'
        },

        'import foo from bar': {
            index: 15,
            lineNumber: 1,
            column: 16,
            message: 'Error: Line 1: Invalid module specifier',
            description: 'Invalid module specifier'
        },

        'export {foo} from bar': {
            index: 17,
            lineNumber: 1,
            column: 18,
            message: "Error: Line 1: Invalid module specifier",
            description: "Invalid module specifier"
        },

        'import default from "foo"': {
            index: 6,
            lineNumber: 1,
            column: 7,
            message: 'Error: Line 1: Unexpected token default',
            description: 'Unexpected token default'
        },
        'export default from "foo"': {
            index: 14,
            lineNumber: 1,
            column: 15,
            message: 'Error: Line 1: Unexpected token from',
            description: 'Unexpected token from'
        },
        'export {default}': {
            index: 16,
            lineNumber: 1,
            column: 17,
            message: 'Error: Line 1: Missing from clause'
        },
        'export *': {
            index: 8,
            lineNumber: 1,
            column: 9,
            message: 'Error: Line 1: Missing from clause',
            description: 'Missing from clause'
        },

        'export * +': {
            index: 8,
            lineNumber: 1,
            column: 9,
            message: 'Error: Line 1: Unexpected token +',
            description: 'Unexpected token +'
        },

        'export {default} +': {
            index: 16,
            lineNumber: 1,
            column: 17,
            message: 'Error: Line 1: Unexpected token +',
            description: 'Unexpected token +'
        },

        'import {default as foo}': {
            index: 23,
            lineNumber: 1,
            column: 24,
            message: 'Error: Line 1: Missing from clause'
        },

        'import * from "foo"': {
            index: 8,
            lineNumber: 1,
            column: 9,
            message: 'Error: Line 1: Missing as after import *',
            description: 'Missing as after import *'
        },

        'export default = 42': {
            index: 15,
            lineNumber: 1,
            column: 16,
            message: 'Error: Line 1: Unexpected token =',
            description: 'Unexpected token ='
        },

        'import {bar}, foo from "foo";': {
            index: 12,
            lineNumber: 1,
            column: 13,
            message: "Error: Line 1: Unexpected token ,",
            description: "Unexpected token ,"
        },

        'import {bar}, * as foo from "foo";': {
            index: 12,
            lineNumber: 1,
            column: 13,
            message: "Error: Line 1: Unexpected token ,",
            description: "Unexpected token ,"
        },

        'import foo, {bar}, foo from "foo";': {
            index: 17,
            lineNumber: 1,
            column: 18,
            message: "Error: Line 1: Unexpected token ,",
            description: "Unexpected token ,"
        },

        'import {bar}, {foo} from "foo";': {
            index: 12,
            lineNumber: 1,
            column: 13,
            message: "Error: Line 1: Unexpected token ,",
            description: "Unexpected token ,"
        },

        'import * as foo, {bar} from "foo";': {
            index: 15,
            lineNumber: 1,
            column: 16,
            message: "Error: Line 1: Unexpected token ,",
            description: "Unexpected token ,"
        },

        'import {} from "foo";': {
            type: 'ImportDeclaration',
            specifiers: [],
            source: {
                type: 'Literal',
                value: 'foo',
                raw: '"foo"',
                range: [15, 20],
                loc: {
                    start: { line: 1, column: 15 },
                    end: { line: 1, column: 20 }
                }
            },
            range: [0, 21],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 21 }
            }
        },

        'export {};': {
            type: 'ExportDeclaration',
            'default': false,
            declaration: null,
            specifiers: [],
            source: null,
            range: [0, 10],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 10 }
            }
        }
    },

    'Tolerated Invalid Syntax': {

        'function f(){ export var g; }': {
            type: 'Program',
            body: [{
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'f',
                    range: [9, 10],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 10 }
                    }
                },
                params: [],
                defaults: [],
                body: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExportDeclaration',
                        'default': false,
                        declaration: {
                            type: 'VariableDeclaration',
                            declarations: [{
                                type: 'VariableDeclarator',
                                id: {
                                    type: 'Identifier',
                                    name: 'g',
                                    range: [25, 26],
                                    loc: {
                                        start: { line: 1, column: 25 },
                                        end: { line: 1, column: 26 }
                                    }
                                },
                                init: null,
                                range: [25, 26],
                                loc: {
                                    start: { line: 1, column: 25 },
                                    end: { line: 1, column: 26 }
                                }
                            }],
                            kind: 'var',
                            range: [21, 27],
                            loc: {
                                start: { line: 1, column: 21 },
                                end: { line: 1, column: 27 }
                            }
                        },
                        specifiers: [],
                        source: null,
                        range: [14, 27],
                        loc: {
                            start: { line: 1, column: 14 },
                            end: { line: 1, column: 27 }
                        }
                    }],
                    range: [12, 29],
                    loc: {
                        start: { line: 1, column: 12 },
                        end: { line: 1, column: 29 }
                    }
                },
                rest: null,
                generator: false,
                expression: false,
                range: [0, 29],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 29 }
                }
            }],
            range: [0, 29],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 29 }
            },
            errors: [{
                index: 13,
                lineNumber: 1,
                column: 14,
                message: "Error: Line 1: Illegal export declaration"
            }]
        },

        'function f(){ import "h"; }': {
            type: 'Program',
            body: [{
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'f',
                    range: [9, 10],
                    loc: {
                        start: { line: 1, column: 9 },
                        end: { line: 1, column: 10 }
                    }
                },
                params: [],
                defaults: [],
                body: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ImportDeclaration',
                        specifiers: [],
                        source: {
                            type: 'Literal',
                            value: 'h',
                            raw: '"h"',
                            range: [21, 24],
                            loc: {
                                start: { line: 1, column: 21 },
                                end: { line: 1, column: 24 }
                            }
                        },
                        range: [14, 25],
                        loc: {
                            start: { line: 1, column: 14 },
                            end: { line: 1, column: 25 }
                        }
                    }],
                    range: [12, 27],
                    loc: {
                        start: { line: 1, column: 12 },
                        end: { line: 1, column: 27 }
                    }
                },
                rest: null,
                generator: false,
                expression: false,
                range: [0, 27],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 27 }
                }
            }],
            range: [0, 27],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 27 }
            },
            errors: [{
                index: 13,
                lineNumber: 1,
                column: 14,
                message: "Error: Line 1: Illegal import declaration"
            }]
        }
    },

    'Invalid Non-Modules Syntax': {
        'export default 42;': {
            index: 0,
            lineNumber: 1,
            column: 1,
            message: "Error: Line 1: Illegal export declaration",
            description: "Illegal export declaration"
        },

        'import foo from "foo";': {
            index: 0,
            lineNumber: 1,
            column: 1,
            message: "Error: Line 1: Illegal import declaration",
            description: "Illegal import declaration"
        }
    }
};

// Merge both test fixtures.

(function () {

    'use strict';

    var i, fixtures, moduleFixtureOptions = {
      sourceType: 'module'
    };

    for (i in modulesTestFixture) {
        if (modulesTestFixture.hasOwnProperty(i)) {
            fixtures = modulesTestFixture[i];
            if (i !== 'Syntax' && testFixture.hasOwnProperty(i)) {
                throw new Error('Harmony test should not replace existing test for ' + i);
            }
            testFixture[i] = fixtures;

            if (i !== 'Invalid Non-Modules Syntax') {
                testFixtureOptions[i] = moduleFixtureOptions;
            }
        }
    }

}());
