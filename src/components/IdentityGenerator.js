import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { get_id_commitment } from '../zkp/private_vote'
import EthrDID from 'ethr-did';

class IdentityGenerator extends Component {    
  constructor(props) {
    super(props);
    this.state = { idc: '' };

    this.handleRemoval = this.handleRemoval.bind(this);
    this.handleGenerate = this.handleGenerate.bind(this);
  }

  handleRemoval() {
    this.setState({ idc: '' });
    window.localStorage.removeItem('secret')
    window.localStorage.removeItem('address')
    window.localStorage.removeItem('did')
    window.localStorage.removeItem('identityCommitment')
  }

  handleGenerate() {
    // 1. Generate Ethereum keypair
    const keypair = EthrDID.createKeyPair()
    let secret = keypair.privateKey

    // 2. Generate DID
    let address = keypair.address
    let did = 'did:ethr:' + address

    // 3. Compute identity commitment
    let identityInt = get_id_commitment(secret)
    let identityCommitment = this.dec2hex(identityInt.id_commitment)

    this.setState({ idc: identityCommitment })

    // Store the secret/did/identity in localStorage
    // TODO: Use Redux
    window.localStorage.setItem('secret', secret)
    window.localStorage.setItem('address', address)
    window.localStorage.setItem('did', did)
    window.localStorage.setItem('identityCommitment', identityCommitment)
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
    let comp
    let idc = window.localStorage.getItem('identityCommitment')
    if (idc) {
      comp = <div>
        <span style={{ color: "white" }}>Identity Commitment: {idc.slice(0, 5) + "......" + idc.slice(59, 64)}</span>
        &nbsp;&nbsp;
        <Button variant="danger" onClick={this.handleRemoval}>
          Change Identity
        </Button>
      </div>
    } else {
      comp = <Button variant="primary" onClick={this.handleGenerate}>
        Generate Identity
      </Button>
    }
    return comp;
  }
}

export default IdentityGenerator;
