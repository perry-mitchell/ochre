const fs = require("fs");
const zlib = require("zlib");

const marking = require("./marking.js");

const lib = module.exports = {

    addFile: function(harness, filename) {
        let size = lib.getFileSize(filename);
        return new Promise(function(resolve, reject) {
            marking.addFile(harness, filename, size);
            let rs = fs.createReadStream(filename);
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
        return stats["size"];
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
            let nextFilename = filesLeft.shift();
            work = work
                .then(() => {
                    console.log(`Adding: ${nextFilename}`);
                })
                .then(() => lib.addFile(harness, nextFilename))
                .then(() => {
                    console.log(`Added:  ${nextFilename}`);
                });
        }
        return work
            .then(function() {
                // done
                harness.instream.end();
                harness.outstream.end();
            });
    }

};
