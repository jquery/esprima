/*jslint browser: true */
/*global runAllBenchmark: true */

function runBenchmarks() {
    'use strict';

    var index = 0,
        totalSize = 0,
        totalTime = 0,
        fixture,
        suite;

    fixture = [
        'jquery-1.7.1',
        'jquery-1.6.4',
        'jquery.mobile-1.0',
        'prototype-1.7.0.0',
        'prototype-1.6.1',
        'ext-core-3.1.0',
        'ext-core-3.0.0',
        'mootools-1.4.1',
        'mootools-1.3.2'
    ];

    function id(i) {
        return document.getElementById(i);
    }

    function kb(bytes) {
        return (bytes / 1024).toFixed(1);
    }

    function setText(id, str) {
        var el = document.getElementById(id);
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    function ready() {
        setText('status', 'Ready.');
        id('runquick').disabled = false;
        id('runquick').style.visibility = 'visible';
        id('runfull').disabled = false;
        id('runfull').style.visibility = 'visible';
    }

    function load(tst, callback) {
        var xhr = new XMLHttpRequest(),
            src = '3rdparty/' + tst + '.js';

        try {
            xhr.timeout = 30000;
            xhr.open('GET', src, true);
            setText('status', 'Please wait. Loading ' + src);

            xhr.ontimeout = function () {
                setText('status', 'Please wait. Error: time out while loading ' + src + ' ');
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
                    setText(tst + '-size', kb(size));
                } else {
                    setText('status', 'Please wait. Error loading ' + src);
                    setText(tst + '-size', 'Error');
                }

                callback.apply();
            };

            xhr.send(null);
        } catch (e) {
            setText('status', 'Please wait. Error loading ' + src);
            callback.apply();
        }
    }

    function loadTests() {
        var sources = fixture.slice();

        function loadNextTest() {
            var tst;

            if (sources.length > 0) {
                tst = sources[0];
                sources.splice(0, 1);
                window.setTimeout(function () {
                    load(tst, loadNextTest);
                }, 100);
            } else {
                setText('total-size', kb(totalSize));
                ready();
            }
        }

        id('runquick').style.visibility = 'hidden';
        id('runfull').style.visibility = 'hidden';
        loadNextTest();
    }

    function runBenchmark() {
        var el, test, source, benchmark;

        if (index >= suite.length) {
            setText('total-time', (1000 * totalTime).toFixed(1));
            ready();
            return;
        }

        test = suite[index];
        el = id(test);
        source = window.data[test];
        setText(test + '-time', 'Running...');

        // Force the result to be held in this array, thus defeating any
        // possible "dead core elimination" optimization.
        window.tree = [];

        benchmark = new window.Benchmark(test, function (o) {
            var syntax = window.esprima.parse(source);
            window.tree.push(syntax.body.length);
        }, {
            'onComplete': function () {
                setText(this.name + '-time', (1000 * this.stats.mean).toFixed(1));
                setText(this.name + '-variance', (1000 * this.stats.variance).toFixed(1));
                totalTime += this.stats.mean;
            }
        });

        window.setTimeout(function () {
            benchmark.run();
            index += 1;
            window.setTimeout(runBenchmark, 211);
        }, 211);
    }

    function startBenchmarks() {
        for (index = 0; index < fixture.length; index += 1) {
            setText(fixture[index] + '-time', '');
            setText(fixture[index] + '-variance', '');
        }
        setText('total-time', '');

        setText('status', 'Please wait. Running benchmarks...');
        id('runquick').style.visibility = 'hidden';
        id('runfull').style.visibility = 'hidden';

        index = 0;
        totalTime = 0;
        runBenchmark();
    }

    id('runquick').onclick = function () {
        suite = ['jquery-1.7.1', 'jquery.mobile-1.0'];
        startBenchmarks();
    };

    id('runfull').onclick = function () {
        suite = fixture.slice();
        startBenchmarks();
    };

    setText('benchmarkjs-version', ' version ' + window.Benchmark.version);
    setText('version', window.esprima.version);

    loadTests();
}

