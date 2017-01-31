const zlib = require("zlib");
const fs = require("fs");

const _glob = require("glob");
const pify = require("pify");
const lpstream = require("length-prefixed-stream");

const glob = pify(_glob);
const lstat = pify(fs.lstat);

const OCHRE_FILE_FORMAT = "ochre.rev1";

function collectFiles(harness) {
    return Promise
        .all(harness.configuration.resources.map(resource => {
            return (resource.type === "files") ?
                glob(resource.pattern) :
                [];
        }))
        .then(function(items) {
            let files = [];
            items.forEach(function(item) {
                files = [...files, ...item];
            });
            return Promise.all(files.map(function(filename) {
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

function createHarness(outputFile, configuration) {
    let outStream = fs.createWriteStream(outputFile),
        zipStream = zlib.createGzip(),
        writeStream = lpstream.encode();
    zipStream.pipe(outStream);
    writeStream.pipe(zipStream);
    return {
        configuration,
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
}

function packFile(harness, fileInfo) {
    return new Promise(function(resolve, reject) {
        // @todo notify
        let packet = {
            filename: fileInfo.filename,
            size: fileInfo.size,
            type: "file"
        };
        harness.writeStream.write(packetToBuffer(packet));
        let fileStream = fs.createReadStream(itemPath);
        fileStream.on("data", function(chunk) {
            harness.writeStream.write(chunk);
        });
        fileStream.on("end", function() {
            resolve();
        });
        fileStream.on("error", reject);
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
    harness.writeStream.write(packetToBuffer({
        ...harness.configuration.config,
        format: OCHRE_FILE_FORMAT
    }));
}

module.exports = {
    collectFiles,
    createHarness,
    disposeHarness
    packFiles,
    writeArchiveHeader
};
