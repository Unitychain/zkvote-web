import React, { Component } from 'react';
import { Card, Button, Col } from 'react-bootstrap';
import { endpoint } from '../env';

class Subject extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();

    const data = new FormData();

    if (window.zkvote) {
      data.set("identityCommiement", window.zkvote.identityCommitment)
      data.set("subjectHash", this.props.subjectHash)

      fetch(endpoint + "/subjects/join", {
        method: 'POST',
        body: data,
      });
    } else {
      console.error("identity commitment is not set yet")
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
              <Button variant="primary" onClick={this.handleSubmit}>Join</Button>
            </Card.Text>
            <Button style={{ margin: '5px' }} variant="primary">Vote</Button>
            {/* <Card.Link href="#">Register</Card.Link>
            <Card.Link href="#">Vote</Card.Link> */}
          </Card.Body>
        </Card>
      </Col>
    )
  }
}

export default Subject;
