#!/usr/bin/env node
/*
 Copyright JS Foundation and other contributors, https://js.foundation/

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

var fs = require('fs');

function fixupbundle(filename) {
    var content, lines, i, line;
    content = fs.readFileSync(filename, 'utf-8');
    lines = content.split('\n');
    for (i = 0; i < lines.length; ++i) {
        line = lines[i];
        if (line.match(/if\(typeof\sexports/)) {
            lines[i] = '/* istanbul ignore next */\n' + line;
        }
        if (line.match(/if\(installedModules\[moduleId\]/)) {
            lines[i] = '/* istanbul ignore if */\n' + line;
        }
        if (line.match(/var __extends/)) {
            lines[i] = '/* istanbul ignore next */\n' + line;
        }
    }
    content = lines.join('\n');
    fs.writeFileSync(filename, content, 'utf-8');
}

fixupbundle(require.resolve('../'));
