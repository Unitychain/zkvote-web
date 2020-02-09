import React, { Component } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import Web3 from 'web3';
import EthrDID from 'ethr-did';
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { createVerifiableCredential, verifyCredential } from 'did-jwt-vc'

class VCPrompt extends Component {    
  constructor(props) {
    super(props);
    this.state = { show: false, identityCommitment: '' };

    this.handleClose = this.handleClose.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleIdcChange = this.handleIdcChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleClose() {
   this.setState({ show: false })
  }

  handleShow() {
    this.setState({ show: true })
  }

  handleIdcChange(event) {
    this.setState({ identityCommitment: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.handleClose()

    let privateKey = window.localStorage.getItem('secret')
    let address = window.localStorage.getItem('address')
    let did = window.localStorage.getItem('did')

    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
    let provider = new Web3.providers.HttpProvider(
      'https://ropsten.infura.io/v3/95d5fb90d73c4b639ab2799ffecd26cc'
    );
    let ethrDid = getResolver({ provider: provider })
    let resolver = new Resolver(ethrDid)

    const issuer = new EthrDID({ privateKey, address })
    const vcPayload = {
      sub: did,
      nbf: 1562950282,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          subjectHash: this.props.subjectHash,
          identityCommitment: this.state.identityCommitment
        }
      }
    }

    createVerifiableCredential(vcPayload, issuer).then(vcJwt => {
      console.log("VC JWT:")
      console.log(vcJwt)
      verifyCredential(vcJwt, resolver).then(verifiedVC => {
        console.log("Verified VC:")
        console.log(verifiedVC)
      })
    })
  }

  // .toString(16) only works up to 2^53
  dec2hex(str) {
    var dec = str.toString().split(''), sum = [], hex = [], i, s
    while(dec.length){
        s = 1 * dec.shift()
        for(i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10
            sum[i] = s % 16
            s = (s - sum[i]) / 16
        }
    }
    while(sum.length){
        hex.push(sum.pop().toString(16))
    }
    return hex.join('')
  }

  render() {
    let genVCBtn
    if (this.props.proposer === window.localStorage.getItem('identityCommitment')) {
        genVCBtn = <Button style={{ margin: '2px' }} variant="success" onClick={this.handleShow}>Generate VC</Button>
    } else {
        genVCBtn = <div />
    }
    return (
      <div>
        {genVCBtn}
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Generate VC</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSubmit}>
              <Form.Group>
                <Form.Label>Identity Commitment</Form.Label>
                <Form.Control name="identityCommitment" type="text" value={this.state.identityCommitment} onChange={this.handleIdcChange}/>
              </Form.Group>
              <Button variant="primary" type="submit">Submit</Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default VCPrompt;
