const privateVote = require('./private_vote.js')
const proof = require('./proof_generation.js');
const fs = require('fs');

const snarkjs = require('snarkjs');
const bigInt = snarkjs.bigInt;

const circomlib = require('circomlib');
const mimcsponge = circomlib.mimcsponge;
const mimc7 = circomlib.mimc7;

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
      current_element = mimc7.multiHash([ bigInt(current_element), bigInt(0) ]);

      path_index.push(current_index % 2);
      current_index = Math.floor(current_index / 2);
    //   console.log(current_element)
    }

    const root = current_element;

    return [root, path_elements, path_index];
};


let build_full_merkle_tree_example = (n_levels, index, identity_commitment) => {
    let tree = [];
    let current_index = index;
    let path_index = [];
    let path_elements = [];
    for (let i = 0; i < n_levels; i++) {
      let tree_level = [];
      path_index.push(current_index % 2);
      for (let j = 0; j < Math.pow(2, n_levels - i); j++) {
        if (i == 0) {
          if (j == index) {
            // tree_level.push(bigInt(0));
            tree_level.push(bigInt(identity_commitment));
          } else {
            tree_level.push(bigInt(0));
            // tree_level.push(bigInt(j));
          }
        } else {
        //   tree_level.push(mimcsponge.multiHash([ tree[i-1][2*j], tree[i-1][2*j+1] ]));
            let h = mimc7.multiHash([ tree[i-1][2*j]/bigInt(8), tree[i-1][2*j+1]/bigInt(8) ])
            // let h = privateVote.pedersenHash( [tree[i-1][2*j], tree[i-1][2*j+1]] );
            tree_level.push(h );
            // console.log(h)
        }
      }
      if (current_index % 2 == 0) {
        path_elements.push(tree_level[current_index + 1]);
      } else {
        path_elements.push(tree_level[current_index - 1]);
      }

      tree.push(tree_level);
      current_index = Math.floor(current_index / 2);
    }

    // const root = mimcsponge.multiHash([ tree[n_levels - 1][0], tree[n_levels - 1][1] ]);
    const root = mimc7.multiHash([ tree[n_levels - 1][0]/bigInt(8), tree[n_levels - 1][1]/bigInt(8) ]);
    // let root = privateVote.pedersenHash([ tree[n_levels - 1][0], tree[n_levels - 1][1] ]);
    console.log("root", root)

    return [root,  path_elements, path_index];
};


const cir_def = JSON.parse(fs.readFileSync('./snark_data/circuit.json', 'utf8'));
const proving_key = JSON.parse(fs.readFileSync('./snark_data/proving_key.json', 'utf8'));
const verification_key = JSON.parse(fs.readFileSync('./snark_data/verification_key.json', 'utf8'));
// const tree = build_merkle_tree_example(10, privateVote.get_id_commitment(private_key).id_commitment)
for (let i=0; i<10; i++) {
    const private_key = "00010203040506070809000102030405060708090001020304050607080900" + i
    const tree = build_full_merkle_tree_example(10, i, privateVote.get_id_commitment(private_key).id_commitment)
    // console.log(tree)
    const identity_path =  {
        "path_elements":tree[1], 
        "path_index":   tree[2], 
        "root": tree[0]
    }
    const proofs = proof.generateProof(
        cir_def,
        proving_key,
        verification_key,
        private_key, 
        identity_path,
        "this is a question.", 
        i%2
    )
    const file = "vote" + i + ".proof"
    fs.writeFileSync(file, JSON.stringify(proofs), "utf8");
    // console.log("output\n", proofs)
}

