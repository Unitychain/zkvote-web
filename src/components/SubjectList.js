import React, { Component } from 'react';
import Subject from './Subject'
import { Row } from 'react-bootstrap';
import { endpoint } from '../env'

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
    fetch(endpoint + "/subjects")
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
        <Row>
          {this.state.subjects.map(subject => (          
            <Subject key={subject.hash}
              subjectHash={subject.hash}
              title={subject.title}
              description={subject.description}
              proposer={subject.proposer} />
          ))}
        </Row>
      </div>
    )
  }
}

export default SubjectList;
