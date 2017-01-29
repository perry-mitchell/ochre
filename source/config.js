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
        let patterns = Array.isArray(data.pattern) ? data.pattern : [data.pattern];
        return Promise
            .all(patterns.map(pattern => glob(pattern)))
            .then(items => flattenArrayOfArrays(items));
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
