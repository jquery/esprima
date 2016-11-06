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

/*
    Reads the fixture files in `test/fixtures` and writes
    two aggregate fixture files (`test/dist/fixtures_js.js` and `test/dist/fixtures_json.js`)
*/

'use strict';

var fs = require('fs'),
    glob = require("glob"),
    path = require('path'),
    fixturePath = 'test/fixtures',
    fixtureDist = 'test/dist';

function renderFixturesFile(ext, stringify) {
    var fixtureFilePaths, fixtures, content, fixtureDistPath;

    function renderFixture(filePath) {
        var content, relativeFilePath, key, value;

        content = fs.readFileSync(filePath, 'utf-8');
        relativeFilePath = path.relative(fixturePath, filePath);

        // On Windows, convert the native separator (backslash) into slash.
        relativeFilePath = relativeFilePath.split(path.sep).join('/');

        key = relativeFilePath.substring(0, relativeFilePath.length - ext.length - 1);
        value = stringify ? JSON.stringify(content) : content;

        return "fixtures_" + ext + "['" + key + "'] = " + value + ";";
    };

    function templateFixtureFile(fixtures) {
        var content = "";
        content += "var fixtures_" + ext + " = {};\n";
        content += fixtures;
        content += "\nif(typeof module !== 'undefined'){ module.exports = fixtures_" + ext + "}";

        return content;
    }

    fixtureFilePaths = glob.sync(path.join(__dirname, '../' + fixturePath + '/**/*.' + ext));
    fixtures = fixtureFilePaths.map(renderFixture).join('\n');
    content = templateFixtureFile(fixtures);

    fixtureDistPath = path.join(fixtureDist, 'fixtures_' + ext + '.js');
    fs.writeFileSync(fixtureDistPath, content);

    console.log('built', fixtureDistPath);
}

renderFixturesFile('js', true);
renderFixturesFile('json', false);
