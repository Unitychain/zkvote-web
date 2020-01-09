import React, { Component } from 'react';
import { Card, Button, Col } from 'react-bootstrap';
import { endpoint } from '../env';
import { generateWitness } from '../zkp/proof_generation';
import snarkjs, { stringifyBigInts } from 'snarkjs';

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

  handleVote (event, opt) {
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

        // Generate Witness
        generateWitness(
          this.props.cir_def,
          window.zkvote.secret,
          identity_path,
          this.props.subjectHash,
          opt
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

  handleVoteDebug(opt) {
    // This two precomputed proofs correspond to
    // Subject Title: new1
    // Subject Description: newnew
    // Subject Proposer: 26a989abbf78c2a92abec7fc91892f58e626203d9a01bc9dd980836062051d48 (from secret 48656c6c6f)
    let zkvote_proof_y = {"root":"11987934088855946922120596363647040988335768868904013217674253507824621847250","nullifier_hash":"6039474324665817342002165254285784666785880224598608370922355984706928812316","proof":{"pi_a":["19433752736949353695886037710842007392853722927724439816192543809222328036722","20683789720378203321149530705592732597266350606075056644017006798514810645637","1"],"pi_b":[["1450230751890325159744235696580605852682334677894163144316382223559523348319","12275952937984648178760372589135124956291590527786116950868433694616824070082"],["5567850104127170326534741222014744802209496592621990597991885551692165274639","2578946353206633082634412548832216864920946245892383269080655877954794956399"],["1","0"]],"pi_c":["12891263595623683784631090528904484765883831885176224372407327071730866708675","1863111621085595622233750051056866721792518776308020346612655996580510265050","1"]},"public_signal":["11987934088855946922120596363647040988335768868904013217674253507824621847250","6039474324665817342002165254285784666785880224598608370922355984706928812316","43379584054787486383572605962602545002668015983485933488536749112829893476306","3589787627103871187122516957505449819480527844184147813671205901831334418180"]}
    let zkvote_proof_n = {"root":"11987934088855946922120596363647040988335768868904013217674253507824621847250","nullifier_hash":"6039474324665817342002165254285784666785880224598608370922355984706928812316","proof":{"pi_a":["21676507260739103690597776962416952123902052741217628400367831740561529258794","21453517188691534674462842106476275485351000640286777429569564873135837578322","1"],"pi_b":[["21343892647524290587673087570599418516484347045183594059812822718475476896589","13629251006149333598557122269240540180794693714090943123851618641618975364684"],["4031544606524691739502110132089145723794239570352561142656336137181708932572","9905402602234485058180224274842162983857854787387129310660359006115164117069"],["1","0"]],"pi_c":["13939143697242350128346499390451280283435563507404982858857676528518003257811","2456568424571125993380801967116622245775803844309758658164369873074295416070","1"]},"public_signal":["11987934088855946922120596363647040988335768868904013217674253507824621847250","6039474324665817342002165254285784666785880224598608370922355984706928812316","85131057757245807317576516368191972321038229705283732634690444270750521936266","3589787627103871187122516957505449819480527844184147813671205901831334418180"]}

    // Sumbit proof
    const data = new FormData();
    data.set("subjectHash", this.props.subjectHash)
    data.set("proof", JSON.stringify(opt ? zkvote_proof_y : zkvote_proof_n))

    fetch(endpoint + "/subjects/vote", {
      method: 'POST',
      body: data,
    })
    .then(res => res.json())
    .then(res => {
      console.log(res.results)
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
            <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleOpen}>Open</Button>
            <br />
            <Button style={{ margin: '2px' }} variant="success" onClick={e => this.handleVote(e, 1)}>Agree</Button>
            <Button style={{ margin: '2px' }} variant="warning" onClick={e => this.handleVote(e, 0)}>Disagree</Button>
            {/* <Button style={{ margin: '2px' }} variant="success" onClick={this.handleVoteDebug.bind(this, 1)}>*Agree</Button>
            <Button style={{ margin: '2px' }} variant="warning" onClick={this.handleVoteDebug.bind(this, 0)}>*Disagree</Button> */}
            {/* <Card.Link href="#">Register</Card.Link>
            <Card.Link href="#">Vote</Card.Link> */}
          </Card.Body>
        </Card>
      </Col>
    )
  }
}

export default Subject;
