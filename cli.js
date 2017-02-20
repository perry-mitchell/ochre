#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const fileExists = require("exists-file").sync;
const osHomedir = require("os-homedir");
const chalk = require("chalk");
const ini = require("ini");
const glob = require("glob");

const argv = require("minimist")(process.argv.slice(2));
const Ochre = require("./source/index.js");

const RETURN_NO_COMMAND =       2;
const RETURN_INVALID_COMMAND =  3;
const RETURN_NO_ARCHIVAL =      4;
const RETURN_ARCHIVAL_ERROR =   5;

const STATE_PATH = path.resolve(osHomedir(), ".ochre");
const args = (argv._ || []);
let command = args[0];

if (!command) {
    console.log("No command specified");
    process.exit(RETURN_NO_COMMAND);
    return;
}

function addFiles(globStr) {
    return scrapeFiles(globStr)
        .then(function(files) {
            let state = readState() || Ochre.createInitialState();
            state.files = [...state.files, ...files];
            writeState(state);
        });
}

function handleAdd(otherArgs) {
    let addCommand = otherArgs.shift();
    switch (addCommand) {
        case "file":
            /* falls-through */
        case "files": {
            if (otherArgs.length <= 0) {
                throw new Error("Expected file pattern(s)");
            }
            otherArgs.forEach(addFiles);
            break;
        }

        default:
            throw new Error(`Unknown type to add: ${addCommand}`);
    }
}

function outputState() {
    if (fileExists(STATE_PATH)) {
        let state = readState();
        console.log("Archival in progress");
        if (state.files && state.files.length > 0) {
            console.log("  Files:");
            state.files.forEach(function(filename) {
                console.log(`    ${chalk.green(filename)}`);
            });
        }
        // if (state.file.pending.length > 0) {
        //     console.log("  Pending:");
        //     state.file.pending.forEach(function(filename) {
        //         console.log(`    ${chalk.yellow(filename)}`);
        //     });
        // }
    } else {
        console.log("No archival in progress - state is empty");
    }
}

function readState() {
    if (fileExists(STATE_PATH)) {
        let stateData = fs.readFileSync(STATE_PATH, "utf8");
        return Ochre.normaliseState(ini.parse(stateData));
    }
    return null;
}

function scrapeFiles(globStr) {
    return new Promise(function(resolve, reject) {
        glob(globStr, {}, function(err, files) {
            if (err) {
                return reject(err);
            }
            return resolve(files);
        });
    });
}

// function showHelp() {
//     console.log(`
// Ochre
// Usage: ochre <config|package> [options]
//     -h, --help              Show this help screen
//     -a                      Create an archive from a configuration (.ochre)
//     -e                      Extract a package
//     -d, --dry-run           Log but take no permanent action
//     --output                Output destination (filename)
//     -q, --quiet             Quiet (yes to all prompts)
//     -v, --version           Output the version
//     `);
// }

function writeState(state) {
    fs.writeFileSync(STATE_PATH, ini.stringify(state), "utf8");
}

switch (command) {
    case "clear": {
        if (fileExists(STATE_PATH)) {
            fs.unlinkSync(STATE_PATH);
            console.log("Archival state cleared");
        } else {
            console.log("No archival in progress");
        }
        break;
    }
    case "status": {
        outputState();
        break;
    }
    case "add": {
        let commands = [...args];
        commands.shift(); // remove 'add'
        handleAdd(commands);
        break;
    }
    case "pack": {
        let filename = args[1],
            state = readState();
        if (filename) {
            if (state) {
                Ochre
                    .createArchive(filename, state)
                    .catch(function(err) {
                        console.error(err.message);
                        process.exit(RETURN_ARCHIVAL_ERROR);
                    });
            } else {
                console.log("No archival in progress");
                process.exit(RETURN_NO_ARCHIVAL);
            }
        } else {
            throw new Error("Expected output file name");
        }
        break;
    }

    default:
        console.log("Invalid command");
        process.exit(RETURN_INVALID_COMMAND);
        return;
}
