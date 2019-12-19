const privateVote = require('./private_vote.js')
const snarkjs = require("snarkjs");
const {unstringifyBigInts, stringifyBigInts} = require('snarkjs/src/stringifybigint.js');
const fs = require('fs');
const chai = require('chai');
const assert = chai.assert;



const bigInt = snarkjs.bigInt;

function generateProof2(cir_def, proving_key, verification_key, prvSeed, quesiton, vote)  {
    const circuit = new snarkjs.Circuit(JSON.parse(fs.readFileSync("./nodejs-proofgenerator/circuit_256.json", 'utf8')));

    // console.log("Vars: "+circuit.nVars);
    // console.log("Constraints: "+circuit.nConstraints);
    // const bits = '1001101000000101010110010011101000111010011001101101010000100110110100101111110110010110110001100010110000011000101011001001010000100110011011011011001101111001010101101000111100000000101010110000010110101101000010100001001100110100000111011101111101111100100110100000010101011001001110100011101001100110110101000010011011010010111111011001011011000110001011000001100010101100100101000010011001101101101100110111100101010110100011110000000010101011000001011010110100001010000100110011010000011101110111110111110010011010000001010101100100111010001110100110011011010100001001101101001011111101100101101100011000101100000110001010110010010100001001100110110110110011011110010101011010001111000000001010101100000101101011010000101000010011001101000001110111011111011111001001101000000101010110010011101000111010011001101101010000100110110100101111110110010110110001100010110000011000101011001001010000100110011011011011001101111001010101101000111100000000101010110000010110101101000010100001001100110100000111011101111101111100'
    const bits = '0010011010000001010101100100111010001110100110011011010100001001101101001011111101100101101100011000101100000110001010110010010100001001100110110110110011011110010101011010001111000000001010101100000101101011010000101000010011001101000001110111011111011111';
    // const bits = '1011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    // c8a7a6e87d10557e3214979b2dda05b16a0e845a7367bcacb1890bfed50aaa97

    const inputs = {};
    for (let i = 0; i < bits.length; i++) {
        inputs[`in_bits[${i}]`] = bigInt(bits[i]);
    }
    const witness = circuit.calculateWitness(inputs);

    let coeff = bigInt(1);
    let result = bigInt(0);
    for (let i = 0; i < 256; i++) {
        result = result.add(bigInt(witness[circuit.getSignalIdx(`main.out[${i}]`)].toString()).mul(coeff));
        //assert.equal(witness[circuit.getSignalIdx(`main.out_bits[${i}]`)].toString(), snarkjs.bigInt(expected_bits[i]).toString());
        coeff = coeff.shl(1);
    }
    console.log("main.out[0]: ", witness[circuit.getSignalIdx(`main.out[0]`)])
    console.log(`blake2s hash: 0x${result.toString(16)}`);
    console.log(`blake2s bigint: ${result.toString()}`);
    // assert.equal(result.toString(16), '4618ffb6f7065211bffe048f7b409c1f78f3c56dbc64b5d202b8f97cd7adc96c');
}

function generateProof(cir_def, proving_key, verification_key, prvSeed, identity_path, quesiton, vote) {

    // generateProof2(cir_def, proving_key, verification_key, prvSeed, quesiton, vote)
    let now = Date.now();
    const inputs = privateVote.vote(prvSeed, identity_path, quesiton, vote)
    console.log(`inputs:`, unstringifyBigInts(inputs));

    // 
    // calculating witness
    //
    now = Date.now();
    const circuit = new snarkjs.Circuit(cir_def);
    const w = circuit.calculateWitness(unstringifyBigInts(inputs));
    console.log(`calculating witness (took ${Date.now() - now} msecs)`);
    assert(circuit.checkWitness(w));

    //
    // verify witness content
    //
    const root = w[circuit.getSignalIdx('main.root')];
    const nullifiers_hash = w[circuit.getSignalIdx('main.nullifiers_hash')];
    console.log("nullifiers_hash : ", nullifiers_hash)
    console.log(`root from proof:`, root);
    assert.equal(root.toString(), identity_path.root);

    //
    // generating proof
    //
    now = Date.now()
    const {proof, publicSignals} = snarkjs.groth.genProof(unstringifyBigInts(proving_key), w);
    console.log(`generating proof (took ${Date.now()-now} msecs)`);
    // console.log(`proof: ${JSON.stringify(stringifyBigInts(proof))}`);

    assert(snarkjs.groth.isValid(unstringifyBigInts(verification_key), proof, publicSignals));
    
    return {
        "root": root.toString(),
        "nullifier_hash": nullifiers_hash.toString(),
        "proof": stringifyBigInts(proof),
        "public_signal": stringifyBigInts(publicSignals)
    }
}

exports.generateProof = generateProof