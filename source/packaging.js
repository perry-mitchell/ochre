const fs = require("fs");
const zlib = require("zlib");

const marking = require("./marking.js");

const lib = module.exports = {

    addFile: function(harness, fileData) {
        let size = lib.getFileSize(fileData.filename);
        return new Promise(function(resolve, reject) {
            marking.addFile(harness, fileData.outputFilename, size);
            let rs = fs.createReadStream(fileData.filename);
            rs.pipe(harness.instream, { end: false });
            rs.on("end", resolve);
            rs.on("error", reject);
        });
    },

    createHarness: function(config) {
        return {
            config,
            outstream: null,
            instream: null
        };
    },

    getFileSize: function(filename) {
        const stats = fs.statSync(filename);
        return stats.size;
    },

    packageUsingConfig: function(config) {
        let harness = lib.createHarness(config);
        harness.outstream = fs.createWriteStream(config.output);
        harness.instream = zlib.createGzip();
        harness.instream.pipe(harness.outstream);
        marking.beginArchive(harness);
        let work = Promise.resolve(),
            filesLeft = [...config.resources.files];
        while (filesLeft.length) {
            let nextFile = filesLeft.shift();
            work = work
                .then(() => {
                    console.log(`Adding: ${nextFile.filename} -> ${nextFile.outputFilename}`);
                })
                .then(() => lib.addFile(harness, nextFile));
        }
        return work
            .then(function() {
                // done
                harness.instream.end();
                harness.outstream.end();
            });
    }

};
