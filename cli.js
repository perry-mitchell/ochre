#!/usr/bin/env node

const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const pkg = require("./package.json");

const Ochre = require("./source/index.js");

function showHelp() {
    console.log(`
Ochre
Usage: ochre <config|package> [options]
    -h, --help              Show this help screen
    -a                      Create an archive from a configuration (.ochre)
    -e                      Extract a package
    -d, --dry-run           Log but take no permanent action
    --output                Output destination (filename)
    -q, --quiet             Quiet (yes to all prompts)
    -v, --version           Output the version
    `);
}

if (argv.h === true || argv.help === true) {
    showHelp();
    return;
}
if (argv.v === true || argv.version === true) {
    console.log(pkg.version);
    return;
}

if (argv.a === true) {
    let configFilename = argv._[0],
        outputFile = path.resolve(path.relative(process.cwd(), argv.output));
    if (!configFilename) {
        throw new Error("No configuration filename specified.");
    }
    if (!outputFile) {
        throw new Error("No output filename specified");
    }
    Ochre
        .createArchive(outputFile, configFilename)
        .catch(function(err) {
            setTimeout(function() {
                throw err;
            }, 0);
        });
} else if (argv.e === true) {
    let archiveFilename = argv._[0],
        dry = argv.d === true || argv["dry-run"] === true,
        outputDir = argv.output ? path.resolve(path.relative(process.cwd(), argv.output)) : false;
    if (!archiveFilename) {
        throw new Error("No archive filename specified.");
    }
    Ochre
        .extractArchive(archiveFilename, dry, outputDir)
        .catch(function(err) {
            setTimeout(function() {
                throw err;
            }, 0);
        });
} else {
    showHelp();
    throw new Error("I have no idea what to do here.");
}
