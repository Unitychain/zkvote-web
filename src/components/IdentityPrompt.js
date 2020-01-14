import React, { Component } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { get_id_commitment } from '../zkp/private_vote'

class IdentityPrompt extends Component {    
  constructor(props) {
    super(props);
    this.state = { show: false, secret: '' };

    this.handleClose = this.handleClose.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleSecretChange = this.handleSecretChange.bind(this);
    this.handleIdcRemoval = this.handleIdcRemoval.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleClose() {
   this.setState({ show: false })
  }

  handleShow() {
    this.setState({ show: true })
  }

  handleSecretChange(event) {
    this.setState({ secret: event.target.value });
  }

  handleIdcRemoval() {
    this.setState({ secret: '' });
    window.localStorage.removeItem('secret')
    window.localStorage.removeItem('identityCommitment')
  }

  handleSubmit(event) {
    event.preventDefault();
    this.handleClose()

    // Compute identity commitment
    let secret = this.state.secret
    let identityInt = get_id_commitment(secret)
    let identityCommitment = this.dec2hex(identityInt.id_commitment)

    // Store the identity commitment in window object
    // This is a workaround
    // TODO: Use Redux or localstorage
    window.localStorage.setItem('secret', secret)
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
    let store = window.localStorage
    let idc = store.getItem('identityCommitment')
    if (idc) {
      comp = <div>
        <span style={{ color: "white" }}>Identity Commitment: {idc.slice(0, 5) + "......" + idc.slice(59, 64)}</span>
        &nbsp;&nbsp;
        <Button variant="danger" onClick={this.handleIdcRemoval}>
          Change Identity
        </Button>
      </div>
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
                <Form.Control name="identityCommitment" type="text" value={this.state.secret} onChange={this.handleSecretChange}/>
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
