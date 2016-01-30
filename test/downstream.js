/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

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
    var nodejs_version = 'v0.12',
        downstream_path;

    if (typeof child_process.execSync !== 'function') {
        console.error('This only works with Node.js that support execSync');
        process.exit(0);
    }
    if (process.version.indexOf(nodejs_version) !== 0) {
        console.error('This is intended to run only with Node.js', nodejs_version);
        process.exit(0);
    }

    downstream_path = temp.mkdirSync('downstream');
    console.log('Running the tests in', downstream_path);

    if (!fs.existsSync(downstream_path)) {
        fs.mkdirSync(downstream_path, 0766);
    }
    process.chdir(downstream_path);

    Object.keys(projects).forEach(function (project) {
        test_project(project, projects[project]);
    });
}


test_downstream({
    'escope': 'https://github.com/estools/escope.git',
    'esmangle': 'https://github.com/estools/esmangle.git',
    'escomplex-js': 'https://github.com/philbooth/escomplex-js.git',
    // 'js2coffee': 'https://github.com/js2coffee/js2coffee.git',
    'redeyed': 'https://github.com/thlorenz/redeyed.git',
    'jsfmt': 'https://github.com/rdio/jsfmt.git',
    'recast': 'https://github.com/benjamn/recast.git',
    'rocambole': 'https://github.com/millermedeiros/rocambole.git',
    'documentjs': 'https://github.com/bitovi/documentjs.git',
    'istanbul': 'https://github.com/gotwarlost/istanbul.git'
});
