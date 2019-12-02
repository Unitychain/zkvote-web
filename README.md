# zkVote

## Introduction

zkVote is based on Semaphore is introduced by [barryWhiteHat](https://github.com/barryWhiteHat) as a method of zero-knowledge signaling - a method for an approved user to broadcast an arbitrary string without exposing their identity. This repository is an implementation of an upgraded version of the concept, including the zero-knowledge circuits and web side.

The project is separated into two parts, one is implemented in plain Node.JS and uses [circom](https://github.com/iden3/circom) for the zero-knowledge proofs.The other is implemented in Golang for verification of zero-knowledge proofs and p2p network.

#### zkVote (TBD)
  The Semaphore contract is the base layer of Semaphore. Other contracts can build upon this to create applications that rely on anonymous signaling. Semaphore has a tree of allowed identities, a tree of signals, a set of previously broadcast nullifiers hashes, multiple external nullifiers and a gas price refund price:

  * The tree of allowed identities allows a prover to show that they are an identity which is approved to signal.
  * The tree of signals allows a user to verify the integrity of a list of signals.
  * The nullifiers hashes set and external nullifier allows the contract to prevent double signals by the same user, within the context of each external nullifier, without exposing the specific user.
  * The gas price refund price is a mechanism that supports transaction abstraction - a server can broadcast on behalf of a user to provide further anonymity, and in return they receive a refund and a small reward, with a maximum gas price for their transaction.

The contract allows administrative operations that only the owner is allowed to perform:

  * Managing identities using the **insertIdentity** and **updateIdentity** methods.
  * Adding or removing an **external_nullifier**.
  * Setting the broadcast permissioning - whether only the owner can broadcast.

The contract allows anyone to read the current state:

* Reading the roots of the two trees.
* Reading the current parameters of **external_nullifier**.

The contract allows anyone to attempt broadcasting a signal, given a signal, a proof and the relevant public inputs.
The contract allows anyone to fund the contract for gas refund and rewards.

Lastly, the contract has a few events to allow a server to build a local state to serve users wishing to generate proofs:

  * **Funded** - when the contract has received some funding for refunds and rewards.
  * **SignalBroadcast** - when a signal has been broadcast successfully, after verification of the proof, the public inputs and double-signaling checks.
  * **LeafAdded**, **LeafUpdated** (from MerkleTreeLib) - when the trees have been updated.


#### MerkleTreeLib

Manages a number of append-only Merkle trees with efficient inserts and updates.

### zkSNARK statement
Implemented in [**semaphorejs/cricom**](semaphorejs/cricom).

The statement assures that given public inputs:

  * **signal_hash**
  * **external_nullifier**
  * **root**
  * **nullifiers_hash**

and private inputs:
  * **identity_pk**
  * **identity_nullifier**
  * **identity_path_elements**
  * **identity_path_index**
  * **auth_sig_r**
  * **auth_sig_s**

the following conditions hold:

  * The commitment of the identity structure (**identity_pk**, **identity_nullifier**) exists in the identity tree with the root **root**, using the path (**identity_path_elements**, **identity_path_index**). This ensures that the user was added to the system at some point in the past.
  * **nullifiers_hash** is uniquely derived from **external_nullifier**, **identity_nullifier** and **identity_path_index**. This ensures a user cannot broadcast a signal with the same **external_nullifier** more than once.
  * The message (**external_nullifier**, **signal_hash**) is signed by the secret key corresponding to **identity_pk**, having the signature (**auth_sig_r**, **auth_sig_s**). This ensures that a state of the contract having a specific **external_nullifier**, ensuring no double-signaling.

#### Cryptographic primitives

Semaphore uses a few cryptographic primitives provided by circomlib:

* MiMCHash for the Merkle tree, the identity commitments and the message hash in the signature.
* EdDSA for the signature.

Note: MiMCHash, and especially the specific paramteres used in the circuit, have not been heavily audited yet by the cryptography community. Additionally, the circuit and code should also receive further review before relying on it for production applications.

### Web

A web interface to generate identities and proofs directly in the browser and broadcast signals to the Golang clients.

