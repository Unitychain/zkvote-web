/*
 * sbmtjs - Storage-backed Merkle tree
 * Copyright (C) 2019 Kobi Gurkan <kobigurk@gmail.com>
 *
 * This file is part of sbmtjs.
 *
 * sbmtjs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * sbmtjs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with sbmtjs.  If not, see <http://www.gnu.org/licenses/>.
 */

const circomlib = require('circomlib');
const pedersenHash = circomlib.pedersenHash;
const babyJub = circomlib.babyJub;
const snarkjs = require('snarkjs');

const bigInt = snarkjs.bigInt;

class PedersenHasher {
    hash(level, left, right) {
        const p = babyJub.unpackPoint(pedersenHash.hash(Buffer.concat([bigInt(left).leInt2Buff(32), bigInt(right).leInt2Buff(32)])));
        return bigInt(p[0]);
    }
}

module.exports = PedersenHasher;
