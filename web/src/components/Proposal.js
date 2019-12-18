import React, { Component } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { endpoint } from '../env'

class Proposal extends Component {
  constructor(props) {
    super(props);
    this.state = {show: false, title: '', description: ''};

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleDescChange = this.handleDescChange.bind(this);
    this.handleClose = this.handleClose.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleTitleChange(event) {
    this.setState({ title: event.target.value });
  }

  handleDescChange(event) {
    this.setState({ description: event.target.value });
  }

  handleClose() {
    this.setState({ show: false })
   }

   handleShow() {
     this.setState({ show: true })
   }

  handleSubmit(event) {
    event.preventDefault();
    this.handleClose()

    const data = new FormData(event.target);

    if (window.zkvote) {
      data.set("identityCommitment", window.zkvote.identityCommitment)

      fetch(endpoint + "/subjects/propose", {
        method: 'POST',
        body: data,
      });
    } else {
      console.error("identity Commitment is not set yet")
    }
  }

  render() {
    return (
      <div>
        <Button variant="primary" onClick={this.handleShow}>
          New Proposal
        </Button>
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>New Proposal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSubmit}>
              <Form.Group>
                <Form.Label>Title</Form.Label>
                <Form.Control name="title" type="text" placeholder="Vote for Lunch" value={this.state.title} onChange={this.handleTitleChange}/>
                <Form.Label>Description</Form.Label>
                <Form.Control name="description" as="textarea" rows="3" placeholder="Let's vote what for lunch!" value={this.state.description} onChange={this.handleDescChange} />
              </Form.Group>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    )
  }
}

export default Proposal;
