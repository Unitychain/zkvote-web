import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav } from 'react-bootstrap';
import logo from './logo.png'
import SubjectList from './components/SubjectList';
import Proposal from './components/Proposal';
import IdentityGenerator from './components/IdentityGenerator';
import DIDDemo from './components/DIDDemo';

function App() {
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#home">
          <img
            alt=""
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          zkvote
        </Navbar.Brand>
        <Nav className="ml-auto">
          <Proposal />
          &nbsp;&nbsp;
          <IdentityGenerator />
          &nbsp;&nbsp;
          <DIDDemo />
        </Nav>
      </Navbar>
      <SubjectList />
    </div>
  );
}

export default App;
