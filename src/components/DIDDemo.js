import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import Web3 from 'web3';
import EthrDID from 'ethr-did';
import didJWT from 'did-jwt';
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { createVerifiableCredential, verifyCredential } from 'did-jwt-vc'

class DIDDemo extends Component {
  constructor(props) {
    super(props);
    this.demoVC = this.demoVC.bind(this)
  }

  demoVC() {
    const keypair = EthrDID.createKeyPair()
    console.log("Generated Private Key:")
    console.log(keypair.privateKey)
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
    let provider = new Web3.providers.HttpProvider(
      'https://ropsten.infura.io/v3/95d5fb90d73c4b639ab2799ffecd26cc'
    );
    let ethrDid = getResolver({ provider: provider })
    let resolver = new Resolver(ethrDid)
    let did = 'did:ethr:' + keypair.address
    console.log("Generated DID:")
    console.log(did)

    // Use did-jwt
    const signer = didJWT.SimpleSigner(keypair.privateKey)
    didJWT.createJWT({
      aud: did,
      exp: 1957463421,
      name: 'uPort Developer'},
      {
        alg: 'ES256K-R',
        issuer: did,
        signer
      }).then(jwt => {
        let decoded = didJWT.decodeJWT(jwt)
        console.log("Decoded JWT:")
        console.log(decoded)

        // Verify
        didJWT.verifyJWT(jwt, { resolver: resolver, audience: did }).then(response =>
          {
            console.log("{payload, doc, issuer, signer, jwt}:")
            console.log(response)
          }
        );
      }
    );

    // Or use did-jwt-vc to make the code cleaner!
    const issuer = new EthrDID({ privateKey: keypair.privateKey, address: keypair.address })
    const vcPayload = {
      sub: did,
      nbf: 1562950282,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          degree: {
            type: 'BachelorDegree',
            name: 'Baccalauréat en musiques numériques'
          }
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

  render() {
    return (
      <Button variant="success" onClick={this.demoVC}>
        Demo VC
      </Button>
    );
  }
}

export default DIDDemo;
