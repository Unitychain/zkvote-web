import React, { Component } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';

class IdentityPrompt extends Component {    
  constructor(props) {
    super(props);
    this.state = { show: false, identityCommitment: '' };

    this.handleClose = this.handleClose.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleIdCommChange = this.handleIdCommChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleClose() {
   this.setState({ show: false })
  }

  handleShow() {
    this.setState({ show: true })
  }

  handleIdCommChange(event) {
    this.setState({ identityCommitment: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.handleClose()

    // Store the identity commitment in window object
    // This is a workaround
    // TODO: Use Redux or localstorage
    window.zkvote = { identityCommitment: this.state.identityCommitment }
  }

  render() {
    let comp
    if (window.zkvote) {
      comp = <span style={{ color: "white" }}>Identity Commitment: {window.zkvote.identityCommitment}</span>
    } else {
      comp = <Button variant="primary" onClick={this.handleShow}>
        Import Identity
      </Button>
    }
    return (
      <div>
        {comp}
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Import Identity</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSubmit}>
              <Form.Group>
                <Form.Label>Identity Commitment</Form.Label>
                <Form.Control name="identityCommitment" type="text" value={this.state.identityCommitment} onChange={this.handleIdCommChange}/>
              </Form.Group>
              <Button variant="primary" type="submit">Submit</Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default IdentityPrompt;
