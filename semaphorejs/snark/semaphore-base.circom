include "../node_modules/circomlib/circuits/pedersen_efficient.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pointbits.circom";
include "../node_modules/circomlib/circuits/eddsa.circom";
include "./blake2s/blake2s.circom";

template Selector() {
  signal input input_elem;
  signal input path_elem;
  signal input path_index;

  signal output left;
  signal output right;

  signal left_selector_1;
  signal left_selector_2;
  signal right_selector_1;
  signal right_selector_2;

  path_index * (1-path_index) === 0

  left_selector_1 <== (1 - path_index)*input_elem;
  left_selector_2 <== (path_index)*path_elem;
  right_selector_1 <== (path_index)*input_elem;
  right_selector_2 <== (1 - path_index)*path_elem;

  left <== left_selector_1 + left_selector_2;
  right <== right_selector_1 + right_selector_2;
}

template Semaphore(jubjub_field_size, n_levels, n_rounds) {
    // BEGIN signals

    signal input signal_hash;
    signal input external_nullifier;
    signal input broadcaster_address;

    // mimc vector commitment
    signal private input identity_pk[2];
    signal private input identity_nullifier;
    signal private input identity_r;
    signal private input identity_path_elements[n_levels];
    signal private input identity_path_index[n_levels];

    // signature on (external nullifier, signal_hash) with identity_pk
    signal private input auth_sig_r[2];
    signal private input auth_sig_s;

    // mimc hash
    signal output root;
    signal output nullifiers_hash;

    // END signals

    var i; var j; var k;
    var pedersen_bits = 4*256;
    component pedersenProvider = PedersenProvider(pedersen_bits);
    component identity_commitment = PedersenNoWindow(pedersen_bits);
    var nSegments = ((pedersen_bits-1)\200)+1;
    var maxNWindows = ((200 - 1)\4)+1;
    for (i=0; i<nSegments; i++) {
      for (j=0; j<maxNWindows; j++) {
        for (k=0; k<2; k++) {
            identity_commitment.base[i][j][k] <== pedersenProvider.baseout[i][j][k];
            identity_commitment.dbl2[i][j][k] <== pedersenProvider.dbl2out[i][j][k];
            identity_commitment.adr3[i][j][k] <== pedersenProvider.adr3out[i][j][k];
            identity_commitment.adr4[i][j][k] <== pedersenProvider.adr4out[i][j][k];
            identity_commitment.adr5[i][j][k] <== pedersenProvider.adr5out[i][j][k];
            identity_commitment.adr6[i][j][k] <== pedersenProvider.adr6out[i][j][k];
            identity_commitment.adr7[i][j][k] <== pedersenProvider.adr7out[i][j][k];
            identity_commitment.adr8[i][j][k] <== pedersenProvider.adr8out[i][j][k];
        }
      }
    }


    // BEGIN identity commitment
    component identity_commitment_n2b[4];
    identity_commitment_n2b[0] = Num2Bits(254);
    identity_commitment_n2b[0].in <== identity_pk[0];
    identity_commitment_n2b[1] = Num2Bits(254);
    identity_commitment_n2b[1].in <== identity_pk[1];
    identity_commitment_n2b[2] = Num2Bits(254);
    identity_commitment_n2b[2].in <== identity_nullifier;
    identity_commitment_n2b[3] = Num2Bits(254);
    identity_commitment_n2b[3].in <== identity_r;
    for (i = 0; i < 256; i++) {
      if (i < 254) {
        identity_commitment.in[i] <== identity_commitment_n2b[0].out[i];
        identity_commitment.in[i+256] <== identity_commitment_n2b[1].out[i];
        identity_commitment.in[i+2*256] <== identity_commitment_n2b[2].out[i];
        identity_commitment.in[i+3*256] <== identity_commitment_n2b[3].out[i];
      } else {
        identity_commitment.in[i] <== 0;
        identity_commitment.in[i+256] <== 0;
        identity_commitment.in[i+2*256] <== 0;
        identity_commitment.in[i+3*256] <== 0;

      }
    }

    // END identity commitment

    // BEGIN tree
    component selectors[n_levels];
    component hashers[n_levels];
    component hashers_n2b[n_levels][2];

    var hasher_pedersen_bits = 2*256;
    component hasherPedersenProvider = PedersenProvider(hasher_pedersen_bits);
    var z;
    var hasherNSegments = ((hasher_pedersen_bits-1)\200)+1;
    for (i = 0; i < n_levels; i++) {
      selectors[i] = Selector();
      hashers[i] = PedersenNoWindow(hasher_pedersen_bits);

      if (i == 0) {
        identity_commitment.out[0] ==> selectors[0].input_elem;
      } else {
        hashers[i-1].out[0] ==> selectors[i].input_elem;
      }

      for (z=0; z<hasherNSegments; z++) {
        for (j=0; j<maxNWindows; j++) {
          for (k=0; k<2; k++) {
              hashers[i].base[z][j][k] <== hasherPedersenProvider.baseout[z][j][k];
              hashers[i].dbl2[z][j][k] <== hasherPedersenProvider.dbl2out[z][j][k];
              hashers[i].adr3[z][j][k] <== hasherPedersenProvider.adr3out[z][j][k];
              hashers[i].adr4[z][j][k] <== hasherPedersenProvider.adr4out[z][j][k];
              hashers[i].adr5[z][j][k] <== hasherPedersenProvider.adr5out[z][j][k];
              hashers[i].adr6[z][j][k] <== hasherPedersenProvider.adr6out[z][j][k];
              hashers[i].adr7[z][j][k] <== hasherPedersenProvider.adr7out[z][j][k];
              hashers[i].adr8[z][j][k] <== hasherPedersenProvider.adr8out[z][j][k];
          }
        }
      }

      identity_path_index[i] ==> selectors[i].path_index;
      identity_path_elements[i] ==> selectors[i].path_elem;

      hashers_n2b[i][0] = Num2Bits(254);
      hashers_n2b[i][0].in <== selectors[i].left;
      hashers_n2b[i][1] = Num2Bits(254);
      hashers_n2b[i][1].in <== selectors[i].right;

      for (z = 0; z < 256; z++) {
        if (z < 254) {
          hashers[i].in[z] <== hashers_n2b[i][0].out[z];
          hashers[i].in[z+256] <== hashers_n2b[i][1].out[z];
        } else {
          hashers[i].in[z] <== 0;
          hashers[i].in[z+256] <== 0;
        }
      }
    }

    root <== hashers[n_levels - 1].out[0];
    // END tree

    // BEGIN nullifiers
    component identity_nullifier_bits = Num2Bits(254);
    identity_nullifier_bits.in <== identity_nullifier;
    component external_nullifier_bits = Num2Bits(254);
    external_nullifier_bits.in <== external_nullifier;

    component nullifiers_hasher = Blake2s(508, 248018401820981);
    for (i = 0; i < 254; i++) {
      nullifiers_hasher.in_bits[i] <== identity_nullifier_bits.out[i];
      nullifiers_hasher.in_bits[254 + i] <== external_nullifier_bits.out[i];
    }

    component nullifiers_hash_num = Bits2Num(253);
    for (i = 0; i < 253; i++) {
      nullifiers_hash_num.in[i] <== nullifiers_hasher.out[i];
    }

    nullifiers_hash <== nullifiers_hash_num.out;

    // END nullifiers

    // BEGIN verify sig

    component msg_hasher_n2b[3];
    msg_hasher_n2b[0] = Num2Bits(254);
    msg_hasher_n2b[0].in <== external_nullifier;
    msg_hasher_n2b[1] = Num2Bits(254);
    msg_hasher_n2b[1].in <== signal_hash;
    msg_hasher_n2b[2] = Num2Bits(254);
    msg_hasher_n2b[2].in <== broadcaster_address;

    component A_bits = Point2Bits_Strict();
    A_bits.in[0] <== identity_pk[0];
    A_bits.in[1] <== identity_pk[1];
    component R8_bits = Point2Bits_Strict();
    R8_bits.in[0] <== auth_sig_r[0];
    R8_bits.in[1] <== auth_sig_r[1];
    component S_bits = Num2Bits(254);
    S_bits.in <== auth_sig_s;

    component sig_verifier = EdDSAVerifier(3*256);
    for (i = 0; i < 256; i++) {
      sig_verifier.A[i] <== A_bits.out[i];
      sig_verifier.R8[i] <== R8_bits.out[i];

      if (i < 254) {
        sig_verifier.S[i] <== S_bits.out[i];
        sig_verifier.msg[i] <== msg_hasher_n2b[0].out[i];
        sig_verifier.msg[i+256] <== msg_hasher_n2b[1].out[i];
        sig_verifier.msg[i+2*256] <== msg_hasher_n2b[2].out[i];
      } else {
        sig_verifier.S[i] <== 0;
        sig_verifier.msg[i] <== 0;
        sig_verifier.msg[i+256] <== 0;
        sig_verifier.msg[i+2*256] <== 0;
      }
    }

    // END verify sig
}
