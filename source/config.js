const path = require("path");
const _glob = require("glob");
const pify = require("pify");

const glob = pify(_glob);

function flattenArrayOfArrays(arr) {
    let items = [];
    arr.forEach(function(subArr) {
        items = [...items, ...subArr];
    });
    return items;
}

const lib = module.exports = {

    createConfigObject: function() {
        return {
            output: "",
            resources: {
                files: []
            }
        };
    },

    findFilesInResource: function(data) {
        return glob(data.pattern)
            .then(function(files) {
                return files.map(function(filename) {
                    let outputFilename = filename;
                    if (data.toRelative) {
                        outputFilename = path.relative(data.toRelative, outputFilename);
                    }
                    return {
                        filename,
                        outputFilename
                    };
                });
            });
    },

    loadConfigFileData: function(data) {
        let obj = lib.createConfigObject();
        let {
            resources
        } = data;
        return Promise
            .all(resources.filter(res => res.type === "files").map(lib.findFilesInResource))
            .then(items => flattenArrayOfArrays(items))
            .then(function(files) {
                obj.resources.files = files;
                return obj;
            });
    }

};
