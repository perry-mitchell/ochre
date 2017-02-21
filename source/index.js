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

function createArchive(targetFile, state) {
    logger.start();
    return Promise.resolve()
        .then(function() {
            let harness = createArchivalHarness(targetFile, normaliseState(state));
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

function createInitialState() {
    return {
        type: "ochre",
        files: []
    };
}

function extractArchive(archiveFilename, { dry, outputPath, list } = { dry: false, outputPath: false, list: false }) {
    logger.start();
    let harness = createExtractionHarness(archiveFilename, { dry, outputPath, list });
    return parseArchive(harness)
        .then(function() {
            logger.stop();
        });
}

function normaliseState(state) {
    state.files = state.files || [];
    return state;
}

// function loadConfiguration(filename) {
//     return readFile(filename, "utf8").then(JSON.parse);
// }

module.exports = {

    createArchive,
    createInitialState,
    extractArchive,
    normaliseState

};
