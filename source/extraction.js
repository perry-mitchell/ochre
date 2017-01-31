const zlib = require("zlib");
const fs = require("fs");
const assert = require("assert");

const lpstream = require("length-prefixed-stream");
const createNullStream = require("dev-null");

function createHarness(archiveFilename) {
    let inStream = fs.createReadStream(archiveFilename),
        zipStream = zlib.createGunzip(),
        readStream = lpstream.decode();
    inStream.pipe(zipStream).pipe(readStream);
    return {
        configuration: null,
        dry: true,
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

function handleChunk(harness, chunk) {
    switch (harness.mode) {
        case "init": {
            harness.configuration = JSON.parse(decodePacket(chunk));
            assert(typeof harness.configuration === "object", "Parsed configuration is not an object");
            harness.mode = "header";
            break;
        }
        case "header": {
            let header = JSON.parse(decodePacket(chunk));
            assert(typeof header === "object", "Parsed header is not an object");
            if (header.type === "file") {
                let outStream = harness.dry ?
                    createNullStream() :
                    fs.createWriteStream(header.filename);
                Object.assign(harness, {
                    mode: "file",
                    currentFile: {
                        filename: header.filename,
                        size: header.size
                    }
                });
            } else {
                throw new Error(`Header type not recognised: ${header.type}`);
            }
            break;
        }
        case "file": {
            harness.currentFile
            break;
        }
        default:
            throw new Error(`Invalid mode: ${harness.mode}`);
    }
}

function parseArchive(harness) {
    return new Promise(function(resolve, reject) {
        harness.readStream.on("error", reject);
        harness.readStream.on("end", resolve);
        harness.readStream.on("data", data => handleChunk(harness, chunk));
    });
}

module.exports = {
    createHarness,
    parseArchive
};
