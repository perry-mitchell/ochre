const logUpdate = require("log-update");
const chalk = require("chalk");

let __sharedLogger = null;

const FRAMES = [
    "⠁",
    "⠃",
    "⠇",
    "⡇",
    "⣇",
    "⣧",
    "⣷",
    "⣿",
    "⣾",
    "⣼",
    "⣸",
    "⢸",
    "⠸",
    "⠘",
    "⠈",
    " "
];

class Logger {

    constructor() {
        this._frameIndex = 0;
        this._frames = [...FRAMES];
        this._interval = null;
        this._message = "Waiting";
        this._task = "init";
    }

    get message() {
        return this._message;
    }

    get nextFrame() {
        this._frameIndex += 1;
        if (this._frameIndex >= this._frames.length) {
            this._frameIndex = 0;
        }
        return this._frames[this._frameIndex];
    }

    get task() {
        return this._task;
    }

    setStatus(task, message) {
        this._task = task;
        this._message = message;
    }

    start() {
        if (this._interval === null) {
            this._interval = setInterval(() => {
                this.update();
            }, 150);
        }
    }

    stop() {
        clearInterval(this._interval);
        this._interval = null;
        logUpdate.clear();
    }

    update() {
        let text = `  ${this.nextFrame}  [${this.task}] ${this.message}`,
            maxLength = process.stdout.columns - 1;
        if (text.length > maxLength) {
            text = `${text.substr(0, maxLength - 3)}...`;
        }
        text = text.replace(/ (\[[a-z0-9_-]+\]) /i, ` ${chalk.cyan("$1")} `);
        logUpdate(`\n${text}\n`);
    }

}

Logger.getSharedLogger = function() {
    if (__sharedLogger === null) {
        __sharedLogger = new Logger();
    }
    return __sharedLogger;
};

module.exports = Logger;
