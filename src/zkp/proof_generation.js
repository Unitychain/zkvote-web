const privateVote = require('./private_vote.js')
const snarkjs = require("snarkjs");
const {unstringifyBigInts, stringifyBigInts} = require('snarkjs/src/stringifybigint.js');
const chai = require('chai');
const assert = chai.assert;

function generateProof(cir_def, proving_key, verification_key, prvSeed, identity_path, quesiton, vote) {
    let now = Date.now();
    const inputs = privateVote.vote(prvSeed, identity_path, quesiton, vote)
    console.log(`inputs:`, unstringifyBigInts(inputs));

    // 
    // calculating witness
    //
    now = Date.now();
    const circuit = new snarkjs.Circuit(cir_def);
    console.log("Witness calculating...")
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
    console.log("Proof generating...")
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