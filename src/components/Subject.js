import React, { Component } from 'react';
import { Card, Button, Col } from 'react-bootstrap';
import { endpoint } from '../env';
import { generateProof } from '../zkp/proof_generation';
import jsZip from 'jszip';
import snarkjs from 'snarkjs';
const bigInt = snarkjs.bigInt;

class Subject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cir_def: {},
      proving_key: {},
      verification_key: {},
      has_snark_data: {
        verification_key: false,
        proving_key: false,
        cir_def: false
      }
    }

    this.handleJoin = this.handleJoin.bind(this);
    this.handleVote = this.handleVote.bind(this);
  }

  componentDidMount() {
    // Download snark data
    let url = new URL(endpoint + "/identities/snark_data");
    let component = this

    fetch(url)
    .then(res => res.blob())
    .then(
      (result) => {
        jsZip.loadAsync(result).then(function (zip) {
          zip.files["snark_data/verification_key.json"].async('string').then(fileData => component.setState({ verification_key: JSON.parse(fileData), has_snark_data: { ...component.state.has_snark_data, verification_key: true }}))
          zip.files["snark_data/proving_key.json"].async('string').then(fileData => component.setState({ proving_key: JSON.parse(fileData), has_snark_data: { ...component.state.has_snark_data, proving_key: true }}))
          zip.files["snark_data/circuit.json"].async('string').then(fileData => component.setState({ cir_def: JSON.parse(fileData), has_snark_data: { ...component.state.has_snark_data, cir_def: true }}))
        })
      },
      // Note: it's important to handle errors here
      // instead of a catch() block so that we don't swallow
      // exceptions from actual bugs in components.
      (error) => {
        this.setState({
          isLoaded: true,
          error
        });
      }
    )
  }

  handleJoin(event) {
    event.preventDefault();

    if (window.zkvote) {
      const data = new FormData();
      data.set("identityCommitment", window.zkvote.identityCommitment)
      data.set("subjectHash", this.props.subjectHash)

      fetch(endpoint + "/subjects/join", {
        method: 'POST',
        body: data,
      });
    } else {
      console.error("identity commitment is not set yet")
    }
  }

  handleVote (event) {
    event.preventDefault();

    if (window.zkvote &&
      this.state.has_snark_data.verification_key === true &&
      this.state.has_snark_data.proving_key === true &&
      this.state.has_snark_data.cir_def === true
      ) {
      // Get identity path first
      let url = new URL(endpoint + "/subjects/identity_path");
      url.search = new URLSearchParams({
        subjectHash: this.props.subjectHash,
        identityCommitment: window.zkvote.identityCommitment
      }).toString();

      fetch(url)
      .then(res => res.json())
      .then(
        res => {
          let identity_path =  {
            "path_elements": res.results.path.map(p => bigInt(p)),
            "path_index": res.results.index,
            "root": bigInt(res.results.root)
          }

          // Generate Proof
          // This will take ~10 minutess
          let zkvote_proof = generateProof(
            this.state.cir_def,
            this.state.proving_key,
            this.state.verification_key,
            window.zkvote.secret,
            identity_path,
            "this is a question.",
            0
          )

          let proof = JSON.stringify(zkvote_proof.proof)
          console.log(proof)

          // Sumbit proof
          const data = new FormData();
          data.set("proof", proof)

          fetch(endpoint + "/subjects/vote", {
            method: 'POST',
            body: data,
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        })
    } else {
      console.log(this.state.has_snark_data)
      console.error("identity commitment is not set yet or snark data is not loaded yet")
    }
  }

  render() {
    return (
      <Col md={4}>
        <Card style={{ width: '90%', margin: '10px' }}>
          <Card.Body>
            <Card.Title>{this.props.title}</Card.Title>
            <Card.Text>
              {this.props.description}
            </Card.Text>
            <Card.Text>
              Proposer: {this.props.proposer}
            </Card.Text>
            <Card.Text>
              Subjech Hash: {this.props.subjectHash}
              <br/>
              <Button variant="primary" onClick={this.handleJoin}>Join</Button>
            </Card.Text>
            <Button style={{ margin: '5px' }} variant="primary" onClick={this.handleVote}>Vote</Button>
            {/* <Card.Link href="#">Register</Card.Link>
            <Card.Link href="#">Vote</Card.Link> */}
          </Card.Body>
        </Card>
      </Col>
    )
  }
}

export default Subject;
