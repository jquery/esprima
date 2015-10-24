module.exports = {
    entry:  __dirname + "/src/esprima.js",
    output: {
        path:  __dirname + "/dist",
        filename: "esprima.js",
        libraryTarget: "umd",
        library: "esprima"
    }
}
