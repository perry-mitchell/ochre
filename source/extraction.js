const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const lpstream = require("length-prefixed-stream");
const createNullStream = require("dev-null");
const through2 = require("through2");
const pify = require("pify");
const __mkdirp = require("mkdirp");
const Logger = require("./Logger.js");

const _mkdirp = (dirname, callback) => __mkdirp(dirname, {}, callback);
const mkdirp = pify(_mkdirp);
const logger = Logger.getSharedLogger();

function createDirectoryForFile(itemPath, harness) {
    let dirPath = path.dirname(itemPath);
    if (harness.createdDirectories.indexOf(dirPath) >= 0) {
        return Promise.resolve();
    }
    harness.createdDirectories.push(dirPath);
    return mkdirp(dirPath);
}

function createHarness(archiveFilename, { dry, outputPath, list } = { dry: false, outputPath: false, list: false }) {
    let inStream = fs.createReadStream(archiveFilename),
        zipStream = zlib.createGunzip(),
        readStream = lpstream.decode();
    inStream.pipe(zipStream).pipe(readStream);
    return {
        archiveFilename,
        configuration: null,
        createdDirectories: [],
        dry,
        list,
        outputPath,
        inStream,
        zipStream,
        readStream,
        mode: "init",
        currentFile: null
    };
}

function decodePacket(buff) {
    return JSON.parse(buff.toString("utf8"));
}

function generateOutputPath(harness) {
    let item = harness.currentFile.filename;
    if (harness.outputPath === false) {
        return item;
    }
    let relativePath = ((harness.configuration.paths && harness.configuration.paths.relative) || [])
        .find(function(relPath) {
            return item.indexOf(relPath) === 0;
        });
    return relativePath ?
        path.join(harness.outputPath, path.relative(relativePath, item)) :
        item;
}

function handleChunk(harness, chunk, encoding, callback) {
    (new Promise(function(resolve, reject) {
        switch (harness.mode) {
            case "init": {
                harness.configuration = decodePacket(chunk);
                assert(typeof harness.configuration === "object", "Parsed configuration is not an object");
                harness.mode = "header";
                return resolve();
            }
            case "header": {
                let header = decodePacket(chunk);
                assert(typeof header === "object", "Parsed header is not an object");
                if (header.type === "file") {
                    Object.assign(harness, {
                        mode: "file",
                        currentFile: {
                            filename: header.filename,
                            outPath: "",
                            size: header.size,
                            sizeLeft: header.size,
                            outStream: null
                        }
                    });
                    harness.currentFile.outPath = generateOutputPath(harness);
                    return createDirectoryForFile(harness.currentFile.outPath, harness)
                        .then(function() {
                            harness.currentFile.outStream = harness.dry ?
                                createNullStream() :
                                fs.createWriteStream(harness.currentFile.outPath);
                        })
                        .then(resolve, reject);
                }
                throw new Error(`Header type not recognised: ${header.type}`);
            }
            case "file": {
                if (harness.list) {
                    console.log("  File:", harness.currentFile.outPath);
                } else {
                    logger.setStatus("unpack", harness.currentFile.outPath);
                }
                let chunkSize = chunk.length;
                harness.currentFile.sizeLeft -= chunkSize;
                harness.currentFile.outStream.write(chunk, undefined, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    if (harness.currentFile.sizeLeft <= 0) {
                        harness.mode = "header";
                        harness.currentFile.outStream.end();
                        harness.currentFile = null;
                    }
                    callback();
                });
                break;
            }
            default:
                reject(new Error(`Invalid mode: ${harness.mode}`));
        }
    })).then(
        () => callback(),
        callback
    );
}

function parseArchive(harness) {
    if (harness.list) {
        console.log("Extracting from:", harness.archiveFilename);
    } else {
        logger.setStatus("init", "Preparing to unpack");
    }
    return new Promise(function(resolve, reject) {
        harness.readStream
            .pipe(through2((chunk, encoding, callback) => handleChunk(harness, chunk, encoding, callback)))
            .on("finish", resolve)
            .on("error", reject);
    });
}

module.exports = {
    createHarness,
    parseArchive
};
