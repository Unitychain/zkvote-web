import React, { Component } from 'react';
import { Card, Button, Col } from 'react-bootstrap';

class Subject extends Component {
  render() {
    return (
      <Col md={4}>
        <Card style={{ width: '100%', margin: '10px' }}>
          <Card.Body>
            <Card.Title>{this.props.title}</Card.Title>
            {/* <Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle> */}
            <Card.Text>
              {this.props.description}
            </Card.Text>
            <Button style={{ margin: '5px' }} variant="primary">Register</Button>
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
