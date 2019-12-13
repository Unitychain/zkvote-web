import React, { Component } from 'react';
import { Col, Form, Button } from 'react-bootstrap';
import { endpoint } from '../env'

class Proposal extends Component {
  constructor(props) {
    super(props);
    this.state = {title: '', description: ''};

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleDescChange = this.handleDescChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleTitleChange(event) {
    this.setState({title: event.target.value});
  }

  handleDescChange(event) {
    this.setState({description: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);

    fetch(endpoint + "/subjects/propose", {
      method: 'POST',
      body: data,
    });
  }

  componentDidMount() {
  }

  render() {
    return (
      <div>
        <h2>Propose a New Subject</h2>
        <Col md={{ span: 10, offset: 1}}>
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
        </Col>
      </div>
    )
  }
}

export default Proposal;
