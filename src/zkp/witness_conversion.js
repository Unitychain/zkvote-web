// const fs = require("fs");
const assert = require("assert");


// const witness = unstringifyBigInts(JSON.parse(fs.readFileSync("./witness.json", "utf8")));


function writeUint32(h, val) {
    // console.log("type of val", typeof(h.dataView))
    h.dataView.setUint32(h.offset, val, true);
    h.offset += 4;
}


function writeBigInt(h, bi) {
    for (let i=0; i<8; i++) {
        const v = bi.shiftRight(i*32).and(0xFFFFFFFF).toJSNumber();
        writeUint32(h, v);
    }
}


function calculateBuffLen(witness) {

    let size = 0;

    // beta2, delta2
    size += witness.length * 32;

    return size;
}



function convert_witness(json_witness) {
    const buffLen = calculateBuffLen(json_witness);

    const buff = new ArrayBuffer(buffLen);

    const h = {
        dataView: new DataView(buff),
        offset: 0
    };

    for (let i=0; i<json_witness.length; i++) {
        writeBigInt(h, json_witness[i]);
    }
    assert.equal(h.offset, buffLen);

    // var wstream = fs.createWriteStream(outputName);
    // wstream.write(Buffer.from(buff));
    // wstream.end();
    // return Buffer.from(buff)
    return buff
}

exports.convert_witness = convert_witness