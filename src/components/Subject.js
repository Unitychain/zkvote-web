import React, { Component } from 'react';
import { Card, Button, Col } from 'react-bootstrap';
import VCGenPrompt from './VCGenPrompt';
import VCVerPrompt from './VCVerPrompt';
import { endpoint } from '../env';

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
    this.handleOpen = this.handleOpen.bind(this);
  }

  componentDidMount() {
    // Open votes
    this.handleOpen()
  }

  handleJoin(event) {
    event.preventDefault();
    let idc = window.localStorage.getItem('identityCommitment')

    if (idc) {
      const data = new FormData();
      data.set("subjectHash", this.props.subjectHash)
      data.set("identityCommitment", idc)

      fetch(endpoint + "/subjects/join", {
        method: 'POST',
        body: data,
      });
    } else {
      console.error("identity commitment is not set yet")
    }
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
              Proposer: {this.props.proposer.slice(0, 5) + "......" + this.props.proposer.slice(59, 64)}
            </Card.Text>
            <Card.Text>
              Subjech Hash: {this.props.subjectHash.slice(0, 5) + "......" + this.props.subjectHash.slice(59, 64)}
            </Card.Text>
            <Card.Text>
              Yes: {this.state.open.yes}, No: {this.state.open.no}
            </Card.Text>
            <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleJoin}>Join</Button>
            <Button style={{ margin: '2px' }} variant="primary" onClick={this.handleOpen}>Open</Button>
            <br />
            <VCVerPrompt proposer={this.props.proposer}
              subjectHash={this.props.subjectHash}
              cir_def={this.props.cir_def}
              proving_key={this.props.proving_key}
              verification_key={this.props.verification_key}
              has_snark_data={this.props.has_snark_data} />
            <br />
            <VCGenPrompt proposer={this.props.proposer}
              subjectHash={this.props.subjectHash} />
          </Card.Body>
        </Card>
      </Col>
    )
  }
}

export default Subject;
