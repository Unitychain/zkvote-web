const privateVote = require('./private_vote.js')
const proof = require('./proof_generation.js');
const fs = require('fs');

const snarkjs = require('snarkjs');
const bigInt = snarkjs.bigInt;

const circomlib = require('circomlib');
const mimcsponge = circomlib.mimcsponge;

// const input = privateVote.vote("0001020304050607080900010203040506070809000102030405060708090001", 
//                                 0,
//                                 "this is a question.", 
//                                 "1")
// console.log(input)

let build_merkle_tree_example = (n_levels, identity_commitment) => {
    let current_index = 0;
    let path_index = [];
    let path_elements = [];
    let current_element = identity_commitment;
    for (let i = 0; i < n_levels; i++) {
      path_elements.push(bigInt(0));
      current_element = mimcsponge.multiHash([ bigInt(current_element), bigInt(0) ]);

      path_index.push(current_index % 2);
      current_index = Math.floor(current_index / 2);
    }

    const root = current_element;

    return [root, path_elements, path_index];
};

const cir_def = JSON.parse(fs.readFileSync('./snark_data/circuit.json', 'utf8'));
const proving_key = JSON.parse(fs.readFileSync('./snark_data/proving_key.json', 'utf8'));
const verification_key = JSON.parse(fs.readFileSync('./snark_data/verification_key.json', 'utf8'));
const tree = build_merkle_tree_example(20, privateVote.get_id_commitment("0001020304050607080900010203040506070809000102030405060708090001").id_commitment)
const identity_path =  {
    "path_elements":tree[1], 
    "path_index":   tree[2], 
    "root": tree[0]
}
const proofs = proof.generateProof(
    cir_def,
    proving_key,
    verification_key,
    "0001020304050607080900010203040506070809000102030405060708090001", 
    identity_path,
    "this is a question.", 
    1
)

fs.writeFileSync("vote.proof", JSON.stringify(proofs), "utf8");
// console.log("output\n", proofs)