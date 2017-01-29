const MARK_ARCHIVE_BEGIN =  0x00;
// const MARK_ARCHIVE_END =    0x01;

const MARK_FILE =           0x10;

function __mark(num) {
    let buff = new Buffer(1);
    buff.writeInt8(num, 0);
    return buff;
}

module.exports = {

    addFile: function(harness, filename, size) {
        harness.outstream.write(__mark(MARK_FILE));
        let filenameBuf = Buffer.from(filename, "utf8"),
            filenameLenBuf = new Buffer(2),
            filesizeBuf = new Buffer(4);
        filenameLenBuf.writeUInt16BE(filenameBuf.length, 0);
        filesizeBuf.writeUInt32BE(size, 0);
        harness.outstream.write(filenameLenBuf);
        harness.outstream.write(filenameBuf);
        harness.outstream.write(filesizeBuf);
    },

    beginArchive: function(harness) {
        harness.outstream.write(__mark(MARK_ARCHIVE_BEGIN));
    }

};
