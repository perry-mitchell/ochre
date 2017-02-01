const fs = require("fs");

const pify = require("pify");
const Logger = require("./Logger.js");

const logger = Logger.getSharedLogger();

const {
    collectFiles,
    createHarness: createArchivalHarness,
    disposeHarness,
    packFiles,
    writeArchiveHeader
} = require("./creation.js");
const {
    createHarness: createExtractionHarness,
    parseArchive
} = require("./extraction.js");

const readFile = pify(fs.readFile);

function createArchive(targetFile, configurationPath) {
    logger.start();
    return loadConfiguration(configurationPath)
        .then(function(configuration) {
            let harness = createArchivalHarness(targetFile, configuration);
            writeArchiveHeader(harness);
            return harness;
        })
        .then(harness => collectFiles(harness).then(() => harness))
        .then(harness => packFiles(harness).then(() => harness))
        .then(harness => disposeHarness(harness))
        .then(function() {
            logger.stop();
        });
}

function extractArchive(archiveFilename, dry = false, outputDir = false) {
    logger.start();
    let harness = createExtractionHarness(archiveFilename, dry, outputDir);
    return parseArchive(harness)
        .then(function() {
            logger.stop();
        });
}

function loadConfiguration(filename) {
    return readFile(filename, "utf8").then(JSON.parse);
}

module.exports = {

    createArchive,
    extractArchive

};
