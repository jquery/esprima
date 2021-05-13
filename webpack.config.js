module.exports = {
    entry:  __dirname + "/dist/tsc/cjs/esprima.js",
    output: {
        path:  __dirname + "/dist",
        filename: "esprima.js",
        libraryTarget: "umd",
        library: "esprima"
    }
}
