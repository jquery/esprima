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

var child_process = require('child_process'),
    fs = require('fs'),
    temp = require('temp').track(),
    source = fs.realpathSync(require.resolve('../'));

function execute(cmd) {
    child_process.execSync(cmd, { stdio: 'inherit' });
}

function copy_file(source, target) {
    fs.writeFileSync(target, fs.readFileSync(source));
}

function workaroundRecastTest() {
    var filename = 'test/es6tests.js', lines, i, line;

    console.log();
    console.log('Applying a workaround...');
    lines = fs.readFileSync(filename, 'utf-8').split('\n');
    for (i = 0; i < lines.length; ++i) {
        line = lines[i];
        if (line.indexOf('const variables must have an initializer') > 0) {
            console.log('-- Patching', filename);
            lines.splice(i, 5);
            fs.writeFileSync(filename, lines.join('\n'));
            break;
        }
    }
    execute('git diff');
}

function workaroundIstanbulTest() {
    var filename = 'test/browser/test-browser-instrumentation.js';

    console.log('Applying a workaround...');
    if (fs.existsSync(filename)) {
        console.log();
        console.log('-- Removing', filename);
        fs.unlinkSync(filename);
    } else {
        console.log('-- Error: Can not locate', filename);
    }
}

function test_project(project, repo) {
    console.log();
    console.log('==========', project);
    console.log();
    console.log('Cloning', repo, '...');
    execute('git clone --depth 1 ' + repo + ' ' + project);

    process.chdir(project);
    console.log();
    console.log('HEAD is');
    execute('git log -n1 > commit.top');
    console.log(fs.readFileSync('commit.top', 'utf-8'));

    if (project === 'recast') {
        workaroundRecastTest();
    } else if (project === 'istanbul') {
        workaroundIstanbulTest();
    }

    console.log();
    execute('npm install');

    console.log();
    console.log('Replacing esprima.js with a fresh one...');
    copy_file(source, './node_modules/esprima/esprima.js');

    console.log();
    try {
        execute('npm test');
    } catch (e) {
        console.log('Failing: ', e.toString());
        process.exit(1);
    }
    process.chdir('..');
}

function test_downstream(projects) {
    var downstream_path = temp.mkdirSync('downstream');
    console.log('Running the tests in', downstream_path);

    if (!fs.existsSync(downstream_path)) {
        fs.mkdirSync(downstream_path, 0766);
    }
    process.chdir(downstream_path);

    Object.keys(projects).forEach(function (project) {
        test_project(project, projects[project]);
    });
}


if (typeof child_process.execSync !== 'function') {
    console.error('This only works with Node.js that support execSync');
    process.exit(0);
}

var projects = {
    'envify': 'https://github.com/hughsk/envify.git',
    'esmangle': 'https://github.com/estools/esmangle.git',
    'escomplex-js': 'https://github.com/philbooth/escomplex-js.git',
    'redeyed': 'https://github.com/thlorenz/redeyed.git',
    'jsfmt': 'https://github.com/rdio/jsfmt.git',
    'rocambole': 'https://github.com/millermedeiros/rocambole.git',
    'istanbul': 'https://github.com/gotwarlost/istanbul.git'
};

// disabled, due to various/spurious failures
/*
projects.escope = 'https://github.com/estools/escope.git';
projects.js2coffee = 'https://github.com/js2coffee/js2coffee.git';
projects.assetgraph = 'https://github.com/assetgraph/assetgraph.git';
projects.recast = 'https://github.com/benjamn/recast.git';
projects.documentjs = 'https://github.com/bitovi/documentjs.git';
*/

test_downstream(projects);
