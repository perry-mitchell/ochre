const fs = require("fs");

const pify = require("pify");

const {
    collectFiles,
    createHarness,
    disposeHarness
    packFiles,
    writeArchiveHeader
} = require("./creation.js");

const readFile = pify(fs.readFile);

function createArchive(targetFile, configurationPath) {
    return loadConfiguration(configurationPath)
        .then(function(configuration) {
            let harness = createHarness(targetFile, configuration);
            writeArchiveHeader(harness);
            return harness;
        })
        .then(harness => collectFiles(harness).then(() => harness))
        .then(harness => packFiles(harness).then(() => harness))
        .then(harness => disposeHarness(harness));
}

function loadConfiguration(filename) {
    return readFile(filename, "utf8").then(JSON.parse);
}

module.exports = {

    createArchive

};
