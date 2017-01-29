const _fs = require("fs");
const pify = require("pify");

const config = require("./config.js");

const fs = pify(_fs);

module.exports = {

    config,

    loadConfig: function(filename, output) {
        return fs
            .readFile(filename, "utf8")
            .then(function(data) {
                let configData = JSON.parse(data);
                return config.loadConfigFileData(configData);
            })
            .then(function(configData) {
                configData.output = output;
                return configData;
            });
    }

};
