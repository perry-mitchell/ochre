const zlib = require("zlib");
const fs = require("fs");

const _glob = require("glob");
const pify = require("pify");

const lpstream = require("length-prefixed-stream");

const glob = pify(_glob);

let filesPattern = "/home/perry/Temp/kiosked-js/**/*";

function addFileItem(itemPath, state) {
    let stat = fs.lstatSync(itemPath);
    return stat.isFile() ?
        new Promise(function(resolve, reject) {
            console.log("Reading: " + itemPath);
            let packet = {
                filename: itemPath,
                size: stat.size,
                type: "file"
            };
            state.writeStream.write(packetToBuffer(packet));
            let fileStream = fs.createReadStream(itemPath);
            // fileStream.pipe(state.writeStream, { end: false });
            fileStream.on("data", function(chunk) {
                state.writeStream.write(chunk);
            });
            fileStream.on("end", function() {
                console.log("Finished: " + itemPath);
                resolve();
            });
            fileStream.on("error", reject);
        }) :
        Promise.resolve();
}

function packetToBuffer(obj) {
    return Buffer.from(JSON.stringify(obj), "utf8");
}

glob(filesPattern)
    .then(function(files) {
        let outStream = fs.createWriteStream("output.ochre"),
            zipStream = zlib.createGzip(),
            writeStream = lpstream.encode();
        zipStream.pipe(outStream);
        writeStream.pipe(zipStream);
        return {
            files,
            outStream,
            zipStream,
            writeStream
        };
    })
    .then(function(state) {
        let work = Promise.resolve();
        state.files.forEach(function(filename) {
            work = work.then(function() {
                return addFileItem(filename, state);
            });
        });
        return work.then(() => state);
    })
    .then(function(state) {
        state.writeStream.end();
        console.log("Done!");
    });
