import React, { Component } from 'react';
import { Card, Button, Col } from 'react-bootstrap';
import { endpoint } from '../env';
import { generateProof } from '../zkp/proof_generation';
import snarkjs from 'snarkjs';
const bigInt = snarkjs.bigInt;

class Subject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: {
        yes: 0,
        no: 0
      }
    }

    this.handleJoin = this.handleJoin.bind(this);
    this.handleVote = this.handleVote.bind(this);
    this.handleVoteDebug = this.handleVoteDebug.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }

  handleJoin(event) {
    event.preventDefault();

    if (window.zkvote) {
      const data = new FormData();
      data.set("subjectHash", this.props.subjectHash)
      data.set("identityCommitment", window.zkvote.identityCommitment)

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
      this.props.has_snark_data.verification_key === true &&
      this.props.has_snark_data.proving_key === true &&
      this.props.has_snark_data.cir_def === true
      ) {
      // Get identity path first
      let url = new URL(endpoint + "/subjects/identity_path");
      url.search = new URLSearchParams({
        subjectHash: this.props.subjectHash,
        identityCommitment: window.zkvote.identityCommitment
      }).toString();

      fetch(url)
      .then(res => res.json())
      .then(res => {
        let identity_path =  {
          "path_elements": res.results.path.map(p => bigInt(p)),
          "path_index": res.results.index,
          "root": bigInt(res.results.root)
        }

        // Generate Proof
        // This will take ~10 minutess
        let zkvote_proof = generateProof(
          this.props.cir_def,
          this.props.proving_key,
          this.props.verification_key,
          window.zkvote.secret,
          identity_path,
          this.props.subjectHash,
          0
        )

        // console.log(JSON.stringify(zkvote_proof.root))
        // console.log(JSON.stringify(zkvote_proof.nullifier_hash))
        // console.log(JSON.stringify(zkvote_proof.proof))
        // console.log(JSON.stringify(zkvote_proof.public_signal))

        // Sumbit proof
        const data = new FormData();
        data.set("subjectHash", this.props.subjectHash)
        data.set("proof", JSON.stringify(zkvote_proof))

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
      console.log(this.props.has_snark_data)
      console.error("identity commitment is not set yet or snark data is not loaded yet")
    }
  }

  handleVoteDebug() {
    let zkvote_proof= {"root":"11987934088855946922120596363647040988335768868904013217674253507824621847250","nullifier_hash":"10904379290953876053387344218603877561403285588622727294496925276926330821634","proof":{"pi_a":["19392027185010717843627025669629081194066013769406217517531644951222831749008","17928270861769032259665484821862320799312498646032118903080617742428774978435","1"],"pi_b":[["7375329943748789156784527025465416837037719471670233273022164053523559291879","9431361778638170377374981918977114105094189631279641098602737823129268069965"],["5977416295975762676440189094224556048921852465526490951103848135535353746930","1197436965527130354872596760601105014694309088437948608917391057431790819338"],["1","0"]],"pi_c":["14876480443851799145283871711796892415045018824113442423733059396179414149177","17515520857584347264376304941059551013905752380483643376320063464589917697346","1"],"protocol":"groth"},"public_signal":["11987934088855946922120596363647040988335768868904013217674253507824621847250","10904379290953876053387344218603877561403285588622727294496925276926330821634","43379584054787486383572605962602545002668015983485933488536749112829893476306","5223042267517509412808214028492453981166929943990137203839434558324753558041"]}

    // Sumbit proof
    const data = new FormData();
    data.set("subjectHash", this.props.subjectHash)
    data.set("proof", JSON.stringify(zkvote_proof))

    fetch(endpoint + "/subjects/vote", {
      method: 'POST',
      body: data,
    });
  }

  handleOpen() {
    let url = new URL(endpoint + "/subjects/open");
    url.search = new URLSearchParams({
      subjectHash: this.props.subjectHash
    }).toString();

    fetch(url)
    .then(res => res.json())
    .then(res => {
      this.setState({ open: res.results })
    })
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
            </Card.Text>
            <Card.Text>
              Yes: {this.state.open.yes}, No: {this.state.open.no}
            </Card.Text>
            <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleJoin}>Join</Button>
            <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleVote}>Vote</Button>
            {/* <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleVoteDebug}>Vote</Button> */}
            <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleOpen}>Open</Button>
            {/* <Card.Link href="#">Register</Card.Link>
            <Card.Link href="#">Vote</Card.Link> */}
          </Card.Body>
        </Card>
      </Col>
    )
  }
}

export default Subject;
