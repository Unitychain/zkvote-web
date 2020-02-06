import React, { Component } from 'react';
import Web3 from 'web3';
import EthrDID from 'ethr-did';
import didJWT from 'did-jwt';
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { createVerifiableCredential, verifyCredential } from 'did-jwt-vc'

class DIDRegistry extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const keypair = EthrDID.createKeyPair()
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
    let provider = new Web3.providers.HttpProvider(
      'https://ropsten.infura.io/v3/95d5fb90d73c4b639ab2799ffecd26cc'
    );
    let ethrDid = getResolver({ provider: provider })
    let resolver = new Resolver(ethrDid)

    // Use did-jwt
    const signer = didJWT.SimpleSigner(keypair.privateKey)
    didJWT.createJWT({
      aud: 'did:ethr:' + keypair.address,
      exp: 1957463421,
      name: 'uPort Developer'},
      {
        alg: 'ES256K-R',
        issuer: 'did:ethr:' + keypair.address,
        signer
      }).then(jwt => {
        let decoded = didJWT.decodeJWT(jwt)
        console.log("Decoded JWT:")
        console.log(decoded)

        // Verify
        didJWT.verifyJWT(jwt, { resolver: resolver, audience: 'did:ethr:' + keypair.address }).then(response =>
          {
            console.log("{payload, doc, issuer, signer, jwt}:")
            console.log(response)
          }
        );
      }
    );

    // Or use did-jwt-vc
    // Cleaner!
    const issuer = new EthrDID(keypair)
    const vcPayload = {
      sub: 'did:ethr:0x435df3eda57154cf8cf7926079881f2912f54db4',
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
      <span>DID</span>
    );
  }
}

export default DIDRegistry;
