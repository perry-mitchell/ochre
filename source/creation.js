const zlib = require("zlib");
const fs = require("fs");

const pify = require("pify");
const through2 = require("through2");
const lpstream = require("length-prefixed-stream");
const Logger = require("./Logger.js");

const logger = Logger.getSharedLogger();
const lstat = pify(fs.lstat);

const OCHRE_FILE_FORMAT = "ochre.rev1";

function collectFiles(harness) {
    return Promise
        .resolve(harness.state.files)
        .then(function(items) {
            let files = [];
            items.forEach(function(item) {
                files = [...files, item];
            });
            return Promise.all(files.map(function(filename) {
                // console.log("STAT", filename);
                return lstat(filename).then(function(stat) {
                    if (stat.isFile()) {
                        harness.files.push({
                            filename,
                            size: stat.size
                        });
                    } else if (stat.isDirectory()) {
                        harness.directories.push({
                            filename
                        });
                    } else {
                        harness.ignored.push({
                            source: "files",
                            path: filename
                        });
                    }
                });
            }));
        });
}

function createHarness(outputFile, state) {
    let outStream = fs.createWriteStream(outputFile),
        zipStream = zlib.createGzip(),
        writeStream = lpstream.encode();
    zipStream.pipe(outStream);
    writeStream.pipe(zipStream);
    return {
        state,
        outStream,
        zipStream,
        writeStream,
        files: [],
        directories: [],
        ignored: []
    };
}

function disposeHarness(harness) {
    harness.writeStream.end();
    logger.setStatus("final", "Waiting");
}

function handleFileChunk(harness, chunk, encoding, callback) {
    (new Promise(function(resolve) {
        harness.writeStream.write(chunk, undefined, resolve);
    })).then(
        () => callback(),
        callback
    );
}

function packFile(harness, fileInfo) {
    logger.setStatus("pack", fileInfo.filename);
    let packet = {
        filename: fileInfo.filename,
        size: fileInfo.size,
        type: "file"
    };
    harness.writeStream.write(packetToBuffer(packet));
    harness.currentFileStream = fs.createReadStream(fileInfo.filename);
    return new Promise(function(resolve, reject) {
        harness.currentFileStream
            .pipe(through2((chunk, encoding, callback) => handleFileChunk(harness, chunk, encoding, callback)))
            .on("finish", resolve)
            .on("error", reject);
    });
}

function packFiles(harness) {
    let work = Promise.resolve();
    harness.files.forEach(function(fileInfo) {
        work = work.then(() => packFile(harness, fileInfo));
    });
    return work;
}

function packetToBuffer(obj) {
    return Buffer.from(JSON.stringify(obj), "utf8");
}

function writeArchiveHeader(harness) {
    harness.writeStream.write(packetToBuffer(Object.assign(
        {},
        {
            format: OCHRE_FILE_FORMAT,
            directories: harness.directories
        }
    )));
}

module.exports = {
    collectFiles,
    createHarness,
    disposeHarness,
    packFiles,
    writeArchiveHeader
};
