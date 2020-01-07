const privateVote = require('./private_vote.js')
const snarkjs = require("snarkjs");
const snarkjsStringify = require('snarkjs/src/stringifybigint.js');
const websnarkStringify =  require('websnark/tools/stringifybigint.js');
const chai = require('chai');
const assert = chai.assert;
const converter = require('./witness_conversion.js')
// const websnark = require('websnark')

const generateWitness = async function(cir_def, prvSeed, identity_path, quesiton, vote) {
    try {
        let now = Date.now();
        const inputs = privateVote.vote(prvSeed, identity_path, quesiton, vote)
        // console.log(`inputs:`, snarkjsStringify.unstringifyBigInts(inputs));

        // 
        // calculating witness
        //
        now = Date.now();
        const circuit = new snarkjs.Circuit(cir_def);
        console.log("Witness calculating...")
        const w = circuit.calculateWitness(snarkjsStringify.unstringifyBigInts(inputs));
        console.log(`calculating witness (took ${Date.now() - now} msecs)`);
        assert(circuit.checkWitness(w));

        const wtmp = websnarkStringify.unstringifyBigInts(JSON.parse(JSON.stringify(snarkjsStringify.stringifyBigInts(w))))
        const wb = converter.convert_witness(wtmp)
        
        //
        // verify witness content
        //
        const root = w[circuit.getSignalIdx('main.root')];
        const nullifiers_hash = w[circuit.getSignalIdx('main.nullifiers_hash')];
        console.log("nullifiers_hash : ", nullifiers_hash)
        console.log(`root from proof:`, root);
        assert.equal(root.toString(), identity_path.root);
    
        let publicSignals = w.slice(1,  circuit.nPubInputs+circuit.nOutputs+1);
        
        return {
            "witness":wb,
            "signals":publicSignals, 
            "root": root,
            "nullifier_hash": nullifiers_hash
        }
    }
    catch(e) {
        console.log(e)
    }
}

// const generateProof = async function(cir_def, proving_key, verification_key, prvSeed, identity_path, quesiton, vote) {

//     try {
//         const w = await generateWitness(cir_def, prvSeed, identity_path, quesiton, vote)

//         //
//         // generating proof
//         //
//         const bn128 = await websnark.buildBn128()
//         now = Date.now()
//         console.log("Proof generating...")
//         const proof = await bn128.groth16GenProof(w.witness, proving_key)
//         // const {proof, publicSignals} = snarkjs.groth.genProof(unstringifyBigInts(proving_key), w);
//         console.log(`generating proof (took ${Date.now()-now} msecs)`);
//         // console.log(`proof: ${JSON.stringify(snarkjsStringifyBigInts(proof))}`);
    
//         assert.isTrue(
//             snarkjs.groth.isValid(
//                 snarkjsStringify.unstringifyBigInts(verification_key), snarkjsStringify.unstringifyBigInts(proof), w.signals
//         ));

//         return {
//             "root": w.root.toString(),
//             "nullifier_hash": w.nullifier_hash.toString(),
//             "proof": snarkjsStringify.stringifyBigInts(proof),
//             "public_signal": snarkjsStringify.stringifyBigInts(w.signals)
//         }
//     }
//     catch(e) {
//         console.log(e)
//     }
// }

exports.generateProof = generateProof
// exports.generateWitness = generateWitness