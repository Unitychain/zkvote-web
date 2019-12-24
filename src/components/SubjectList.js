import React, { Component } from 'react';
import Subject from './Subject'
import { Row } from 'react-bootstrap';
import { endpoint } from '../env'
import jsZip from 'jszip';

class SubjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      subjects: [],
      cir_def: {},
      proving_key: {},
      verification_key: {},
      has_snark_data: {
        verification_key: false,
        proving_key: false,
        cir_def: false
      }
    };

    this.getSnarkData = this.getSnarkData.bind(this);
  }

  componentDidMount() {
    this.getSnarkData()

    fetch(endpoint + "/subjects")
      .then(res => res.json())
      .then(result => {
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

  getSnarkData () {
    // Download snark data
    let url = new URL(endpoint + "/identities/snark_data");
    let component = this
  
    fetch(url)
    .then(res => res.blob())
    .then(
      (result) => {
        jsZip.loadAsync(result).then(function (zip) {
          zip.files["snark_data/verification_key.json"].async('string').then(fileData => component.setState({ verification_key: JSON.parse(fileData), has_snark_data: { ...component.state.has_snark_data, verification_key: true }}))
          zip.files["snark_data/proving_key.json"].async('string').then(fileData => component.setState({ proving_key: JSON.parse(fileData), has_snark_data: { ...component.state.has_snark_data, proving_key: true }}))
          zip.files["snark_data/circuit.json"].async('string').then(fileData => component.setState({ cir_def: JSON.parse(fileData), has_snark_data: { ...component.state.has_snark_data, cir_def: true }}))
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
              proposer={subject.proposer}
              cir_def={this.state.cir_def}
              proving_key={this.state.proving_key}
              verification_key={this.state.verification_key}
              has_snark_data={this.state.has_snark_data} />
          ))}
        </Row>
      </div>
    )
  }
}

export default SubjectList;
