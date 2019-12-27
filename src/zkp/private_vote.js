/*
 * semaphorejs - Zero-knowledge signaling on Ethereum
 * Copyright (C) 2019 Kobi Gurkan <kobigurk@gmail.com>
 *
 * This file is part of semaphorejs.
 *
 * semaphorejs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * semaphorejs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with semaphorejs.  If not, see <http://www.gnu.org/licenses/>.
 */

const crypto = require('crypto');
// const path = require('path');
const blake = require('blakejs')
// const {unstringifyBigInts, stringifyBigInts} = require('websnark/tools/stringifybigint.js');
const {stringifyBigInts} = require('snarkjs/src/stringifybigint.js');

const chai = require('chai');
const assert = chai.assert;

const snarkjs = require('snarkjs');
// const bigInt = require("big-integer");
const bigInt = snarkjs.bigInt;

const circomlib = require('circomlib');
const eddsa = circomlib.eddsa;
const mimcsponge = circomlib.mimcsponge;

const ethers = require('ethers');

// let logger;
const SECRET_HASH_RUNS = 100;


function pedersenHash(ints) {
  const p = circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(Buffer.concat(
             ints.map(x => x.leInt2Buff(32))
  )));
  return bigInt(p[0]);
}

function blake2s(ints) {
  var hash = blake.blake2sHex(Buffer.concat(ints.map(x => x.beInt2Buff(32))))
  // console.log(" hex of blake2:\n  ", hash)
  return bigInt.beBuff2int(Buffer.from(hash, "hex"));
}

function vote(private_key, identity_path, question, signal) {
    console.log(`identity_path: ${stringifyBigInts(identity_path)}`);
    const prvKey = Buffer.from(private_key, 'hex');
    const pubKey = eddsa.prv2pub(prvKey);
    
    const id = get_id_commitment(private_key)
    // console.log("secret:\n ", id.id_secret, " --> identity_secret")
    // console.log("id commitment:\n ", id.id_commitment)

    // verify signature
    // let big_question = bigInt.leBuff2int(Buffer.from(question));
    // const question_hash = circomlib.mimcsponge.multiHash([big_question])
    const hex_question_hash = ethers.utils.solidityKeccak256(
      ['string'],
      [question],
    );
    let question_hash = bigInt.beBuff2int(Buffer.from(hex_question_hash.slice(2), 'hex'));
    question_hash = question_hash/bigInt(8)
    // question_hash = bigInt("16006556194422204507365531149559851628469255505732934222920126460960359256387")
  
    // const big_signal = bigInt(signal)
    // const signal_hash = circomlib.mimcsponge.multiHash([big_signal])
    const hex_signal_hash = ethers.utils.solidityKeccak256(
      ['int8'],
      [signal],
    );
    const signal_hash = bigInt.beBuff2int(Buffer.from(hex_signal_hash.slice(2), 'hex'));
    // console.log("signal, ", signal_hash)

    
    const msg = mimcsponge.multiHash([question_hash, signal_hash]);
    const signature = eddsa.signMiMCSponge(prvKey, msg);
    assert(eddsa.verifyMiMCSponge(msg, signature, pubKey));

    // nullifier hash
    // Not ready yet
    // const nullifier_hash = blake2s([big_id_secret, question_hash, identity_path.path_index])
    // console.log("nullifier_hash:\n ",  nullifier_hash, " --> out_nullifier_hash");

    const identity_path_elements = identity_path.path_elements
    const identity_path_index = identity_path.path_index
    return {
        'identity_pk[0]': pubKey[0],
        'identity_pk[1]': pubKey[1],
        'auth_sig_r[0]': signature.R8[0],
        'auth_sig_r[1]': signature.R8[1],
        auth_sig_s: signature.S,
        signal_hash,
        'external_nullifier': question_hash,
        'identity_secret': id.id_secret,
        identity_path_elements,
        identity_path_index,
        fake_zero: bigInt(0),
    };
}

function get_id_commitment(private_key) {

    const prvKey = Buffer.from(private_key, 'hex');
    const pubKey = eddsa.prv2pub(prvKey);

    let big_id_secret = bigInt("0x" + private_key);
    for (let i=0; i<SECRET_HASH_RUNS; i++) {
        big_id_secret = blake2s([big_id_secret, bigInt(i)]);
    }
    // workaround for circom Num2Bits
    big_id_secret = big_id_secret/bigInt(8)
    // console.log(`identity_secret: ${big_id_secret}`);

    let id_commitment = pedersenHash([bigInt(circomlib.babyJub.mulPointEscalar(pubKey, 8)[0]), big_id_secret]);
    // console.log(`identity_commitment : ${id_commitment}`);
    return  {
        id_secret: big_id_secret.toString(),
        id_commitment: id_commitment.toString()
    };
}

function generate_identity() {
  const private_key = crypto.randomBytes(32).toString('hex');
  const pubKey = eddsa.prv2pub(Buffer.from(private_key, 'hex'));
  console.log(`generate identity from (private_key, public_key[0], public_key[1]): 
      (${private_key}, ${pubKey[0]}, ${pubKey[1]})`);

  return private_key;
}

module.exports = {
  vote,
  generate_identity,
  get_id_commitment,
  pedersenHash,
};
