import React, { Component } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import Web3 from 'web3';
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { verifyCredential } from 'did-jwt-vc'
import { endpoint } from '../env';
import { generateWitness } from '../zkp/proof_generation';
import snarkjs, { stringifyBigInts } from 'snarkjs';
const bigInt = snarkjs.bigInt;

class VCVerPrompt extends Component {    
  constructor(props) {
    super(props);
    this.state = { show: false, VCJWT: '', opt: 0 };

    this.handleClose = this.handleClose.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleVCJWTChange = this.handleVCJWTChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleClose() {
   this.setState({ show: false })
  }

  handleShow(opt) {
    this.setState({ show: true, opt })
  }

  handleVCJWTChange(event) {
    this.setState({ VCJWT: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.handleClose()

    let idc = window.localStorage.getItem('identityCommitment')
    let secret = window.localStorage.getItem('secret')

    // Verify VC
    if (this.state.VCJWT) {
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
      let provider = new Web3.providers.HttpProvider(
          'https://ropsten.infura.io/v3/95d5fb90d73c4b639ab2799ffecd26cc'
      );
      let ethrDid = getResolver({ provider: provider })
      let resolver = new Resolver(ethrDid)
      let vcJwt = this.state.VCJWT
  
      verifyCredential(vcJwt, resolver).then(verifiedVC => {
        console.log("Decoded VC Payload:")
        console.log(verifiedVC.payload)

        // Validate if the subjectHash and identityCommitment matches
        let VCSubjectHash = verifiedVC.payload.vc.credentialSubject.subjectHash
        let VCIdc = verifiedVC.payload.vc.credentialSubject.identityCommitment

        if (this.props.subjectHash === VCSubjectHash && VCIdc === idc) {
          // Generate Ballot
          if (idc && secret &&
            this.props.has_snark_data.verification_key === true &&
            this.props.has_snark_data.proving_key === true &&
            this.props.has_snark_data.cir_def === true
            ) {
            // Get identity path first
            let url = new URL(endpoint + "/subjects/identity_path");
            url.search = new URLSearchParams({
              subjectHash: this.props.subjectHash,
              identityCommitment: idc
            }).toString();

            fetch(url)
            .then(res => {
              if (res.ok) {
                return res.json()
              } else {
                throw new Error("Can't get idenitty path");
              }
            })
            .then(res => {
              let identity_path =  {
                "path_elements": res.results.path.map(p => bigInt(p)),
                "path_index": res.results.index,
                "root": bigInt(res.results.root)
              }

              // Generate Witness
              generateWitness(
                this.props.cir_def,
                secret,
                identity_path,
                this.props.subjectHash,
                this.state.opt
              ).then(res => {
                // Generate Proof
                // This will take ~60 seconds
                let witness = res
                let now = Date.now();
                window.groth16GenProof(witness.witness, this.props.proving_key).then(proof => {
                  console.log(`calculating proof (took ${Date.now() - now} msecs)`);
                  let zkvote_proof = JSON.stringify({
                    root: witness.root.toString(),
                    nullifier_hash: witness.nullifier_hash.toString(),
                    proof: stringifyBigInts(proof),
                    public_signal: stringifyBigInts(witness.signals)
                  })

                  // Sumbit proof
                  const data = new FormData();
                  data.set("subjectHash", this.props.subjectHash)
                  data.set("proof", zkvote_proof)

                  fetch(endpoint + "/subjects/vote", {
                    method: 'POST',
                    body: data,
                  })
                  .then(res => res.json())
                  .then(res => {
                    console.log(res)
                  })
                })
              })
            })
            .catch(err => {
              console.log('Request failed', err)
            })
          } else {
            console.log(this.props.has_snark_data)
            console.error("identity commitment is not set yet or snark data is not loaded yet")
          }
        } else {
          console.error("VC is not valid")
        }
      }).catch(err => {
        console.error(err)
      })
    } else {
      console.error("VC is not given")
    }
  }

  render() {
    return (
      <div>
        <Button style={{ margin: '2px' }} variant="success" onClick={e => this.handleShow(1)}>Agree</Button>
        <Button style={{ margin: '2px' }} variant="warning" onClick={e => this.handleShow(0)}>Disagree</Button>
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Verify VC</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSubmit}>
              <Form.Group>
                <Form.Label>VC</Form.Label>
                <Form.Control name="vcjwt" type="text" value={this.state.VCJWT} onChange={this.handleVCJWTChange}/>
              </Form.Group>
              <Button variant="primary" type="submit">Submit</Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default VCVerPrompt;
