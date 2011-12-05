/*jslint browser: true */

function runBenchmarks() {
    'use strict';
    var index = 0,
        totalSize = 0,
        totalTime = 0,
        fixture;

    fixture = [
        'esprima jquery-1.7.1',
        'narcissus jquery-1.7.1',
        'parsejs jquery-1.7.1',
        'zeparser jquery-1.7.1',

        'esprima prototype-1.7.0.0',
        'narcissus prototype-1.7.0.0',
        'parsejs prototype-1.7.0.0',
        'zeparser prototype-1.7.0.0',

        'esprima mootools-1.4.1',
        'narcissus mootools-1.4.1',
        'parsejs mootools-1.4.1',
        'zeparser mootools-1.4.1',

        'esprima ext-core-3.1.0',
        'narcissus ext-core-3.1.0',
        'parsejs ext-core-3.1.0',
        'zeparser ext-core-3.1.0'
    ];

    totalTime = {
        'esprima': 0,
        'narcissus': 0,
        'parsejs': 0,
        'zeparser': 0
    };

    function showVersion() {
        var el = document.getElementById('benchmarkjs-version');
        el.textContent = ' version ' + window.Benchmark.version;
        el = document.getElementById('version');
        el.textContent = window.esprima.version;
    }

    function showStatus(parser, name) {
        var el = document.getElementById(parser + '-' + name);
        el.textContent = 'Running...';
    }

    function finish() {
        var el = document.getElementById('status');
        el.textContent = 'Completed.';
        el = document.getElementById('total-size');
        el.textContent = (totalSize / 1024).toFixed(1);
        el = document.getElementById('esprima-time');
        el.textContent = (1000 * totalTime.esprima).toFixed(1) + ' ms';
        el = document.getElementById('narcissus-time');
        if (totalTime.narcissus > 0) {
            el.textContent = (1000 * totalTime.narcissus).toFixed(1) + ' ms';
        }
        el = document.getElementById('parsejs-time');
        el.textContent = (1000 * totalTime.parsejs).toFixed(1) + ' ms';
        el = document.getElementById('zeparser-time');
        el.textContent = (1000 * totalTime.zeparser).toFixed(1) + ' ms';
    }

    function showResult(parser, name, size, stats) {
        var el;
        el = document.getElementById(name + '-size');
        el.textContent = (size / 1024).toFixed(1);
        el = document.getElementById(parser + '-' + name);
        if (stats.size === 0) {
            el.textContent = 'N/A';
        } else {
            el.textContent = (1000 * stats.mean).toFixed(1) + ' ms';
        }
    }

    function runBenchmark() {
        var test, source, parser, fn, benchmark;

        if (index >= fixture.length) {
            finish();
            return;
        }

        test = fixture[index].split(' ');
        parser = test[0];
        test = test[1];

        if (!document.getElementById(test)) {
            throw 'Unknown text fixture ' + test;
        }

        source = document.getElementById(test).textContent;
        showStatus(parser, test);

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
                showResult(parser, this.name, source.length, this.stats);
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

    showVersion();
    window.setTimeout(runBenchmark, 211);
}

