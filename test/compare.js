/*jslint browser: true */

function runBenchmarks() {
    'use strict';

    var index = 0,
        totalSize = 0,
        totalTime = {},
        fixture;

    fixture = [
        'esprima jquery-1.7.1',
        'parsejs jquery-1.7.1',
        'zeparser jquery-1.7.1',
        'narcissus jquery-1.7.1',

        'esprima prototype-1.7.0.0',
        'parsejs prototype-1.7.0.0',
        'zeparser prototype-1.7.0.0',
        'narcissus prototype-1.7.0.0',

        'esprima mootools-1.4.1',
        'parsejs mootools-1.4.1',
        'zeparser mootools-1.4.1',
        'narcissus mootools-1.4.1',

        'esprima ext-core-3.1.0',
        'parsejs ext-core-3.1.0',
        'zeparser ext-core-3.1.0',
        'narcissus ext-core-3.1.0'
    ];

    function id(i) {
        return document.getElementById(i);
    }

    function kb(bytes) {
        return (bytes / 1024).toFixed(1);
    }

    function setText(el, str) {
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    function ready() {
        setText(id('status'), 'Ready.');
        id('run').disabled = false;
        id('run').style.visibility = 'visible';
    }

    function load(tst, callback) {
        var el = id('status'),
            xhr = new XMLHttpRequest(),
            src = '3rdparty/' + tst + '.js';

        // Already available? Don't reload from server.
        if (window.data && window.data.hasOwnProperty(tst)) {
            callback.apply();
        }

        try {
            xhr.timeout = 30000;
            xhr.open('GET', src, true);
            setText(el, 'Please wait. Loading ' + src);

            xhr.ontimeout = function () {
                setText(el, 'Please wait. Error: time out while loading ' + src + ' ');
                callback.apply();
            };

            xhr.onreadystatechange = function () {
                var success = false,
                    size = 0;

                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        window.data = window.data || {};
                        window.data[tst] = this.responseText;
                        size = this.responseText.length;
                        totalSize += size;
                        success = true;
                    }
                }

                if (success) {
                    setText(id(tst + '-size'), kb(size));
                } else {
                    setText(el, 'Please wait. Error loading ' + src);
                    setText(id(tst + '-size'), 'Error');
                }

                callback.apply();
            };

            xhr.send(null);
        } catch (e) {
            setText(el, 'Please wait. Error loading ' + src);
            callback.apply();
        }
    }


    function loadTests() {
        var sources = fixture.slice();

        function loadNextTest() {
            var tst;

            if (sources.length > 0) {
                tst = sources[0].split(' ');
                tst = tst[1];
                sources.splice(0, 1);
                window.setTimeout(function () {
                    load(tst, loadNextTest);
                }, 100);
            } else {
                setText(id('total-size'), kb(totalSize));
                ready();
            }
        }

        id('run').style.visibility = 'hidden';
        loadNextTest();
    }

    function runBenchmark() {
        var test, source, parser, fn, benchmark;

        if (index >= fixture.length) {
            setText(id('total-size'), kb(totalSize));
            setText(id('esprima-time'), (1000 * totalTime.esprima).toFixed(1) + ' ms');
            setText(id('parsejs-time'), (1000 * totalTime.parsejs).toFixed(1) + ' ms');
            setText(id('zeparser-time'), (1000 * totalTime.zeparser).toFixed(1) + ' ms');
            if (totalTime.narcissus > 0) {
                setText(id('narcissus-time'), (1000 * totalTime.narcissus).toFixed(1) + ' ms');
            }
            ready();
            return;
        }

        test = fixture[index].split(' ');
        parser = test[0];
        test = test[1];

        source = window.data[test];
        setText(id(parser + '-' + test), 'Running...');

        // Force the result to be held in this array, thus defeating any
        // possible "dead core elimination" optimization.
        window.tree = [];

        switch (parser) {
        case 'esprima':
            fn = function () {
                var syntax = window.esprima.parse(source);
                window.tree.push(syntax.body.length);
            };
            break;
        case 'narcissus':
            fn = function () {
                var syntax = window.Narcissus.parser.parse(source);
                window.tree.push(syntax.children.length);
            };
            break;
        case 'parsejs':
            fn = function () {
                var syntax = window.parseJS.parse(source);
                window.tree.push(syntax.length);
            };
            break;
        case 'zeparser':
            fn = function () {
                var syntax = window.ZeParser.parse(source, false);
                window.tree.push(syntax.length);
            };
            break;
        default:
            throw 'Unknown parser type ' + parser;
        }

        benchmark = new window.Benchmark(test, fn, {
            'onComplete': function () {
                setText(id(parser + '-' + this.name), (1000 * this.stats.mean).toFixed(1) + ' ms');
                totalSize += source.length;
                totalTime[parser] += this.stats.mean;
            }
        });

        window.setTimeout(function () {
            benchmark.run();
            index += 1;
            window.setTimeout(runBenchmark, 211);
        }, 211);
    }

    id('run').onclick = function () {

        var test;

        for (index = 0; index < fixture.length; index += 1) {
            test = fixture[index].split(' ').join('-');
            setText(id(test), '');
        }

        setText(id('status'), 'Please wait. Running benchmarks...');
        id('run').style.visibility = 'hidden';

        index = 0;
        totalTime = {
            'esprima': 0,
            'narcissus': 0,
            'parsejs': 0,
            'zeparser': 0
        };

        for (test in totalTime) {
            if (totalTime.hasOwnProperty(test)) {
                setText(id(test + '-time'), '');
            }
        }

        runBenchmark();
    };

    setText(id('benchmarkjs-version'), ' version ' + window.Benchmark.version);
    setText(id('version'), window.esprima.version);

    loadTests();
}

