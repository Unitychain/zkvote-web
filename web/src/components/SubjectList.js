import React, { Component } from 'react';
import Subject from './Subject'
import { Row } from 'react-bootstrap';

class SubjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      subjects: []
    };
  }

  componentDidMount() {
    fetch("http://127.0.0.1:3001/subjects")
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            subjects: result.results
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
        }
      )
  }

  render() {
    return (
      <div>
        <h2>Join a Subject</h2>
        <Row>
          {this.state.subjects.map(subject => (          
            <Subject key={subject.hash} title={subject.title} description={subject.description} />
          ))}
        </Row>
      </div>
    )
  }
}

export default SubjectList;
