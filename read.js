const zlib = require("zlib");
const fs = require("fs");

const lpstream = require("length-prefixed-stream");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

function decodePacket(buff) {
    return JSON.parse(buff.toString("utf8"));
}

let target = "/home/perry/Temp/ochre/output.ochre",
    destination = "/home/perry/Temp/ochre/extracted";

let relPath = "/home/perry/Temp";

rimraf.sync(destination);
mkdirp.sync(destination);

let inStream = fs.createReadStream(target),
    zipStream = zlib.createGunzip(),
    readStream = lpstream.decode();

inStream.pipe(zipStream);
zipStream.pipe(readStream);

let mode = "header",
    currentFile = null,
    currentSize = 0;

readStream.on("data", function(item) {
    switch (mode) {
        case "header": {
            let header = decodePacket(item);
            if (header.type === "file") {
                if (header.size > 0) {
                    mode = "file";
                    currentFile = header.filename;
                    currentSize = header.size;
                }
                console.log("Read: " + currentFile + ` (${currentSize})`);
            } else {
                throw new Error(`Unknown header type: ${header.type}`);
            }
            break;
        }
        case "file": {
            currentSize -= item.length;
            if (currentSize <= 0) {
                mode = "header";
                currentFile = null;
                currentSize = 0;
            }
            break;
        }
        default:
            throw new Error(`Unknown mode: ${mode}`);
    }
});
