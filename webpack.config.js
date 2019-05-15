module.exports = {
    entry:  __dirname + "/lib/esprima.js",
    output: {
        path:  __dirname + "/dist",
        filename: "esprima.js",
        libraryTarget: "umd",
        library: "esprima"
    }
}
