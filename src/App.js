import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav } from 'react-bootstrap';
import SubjectList from './components/SubjectList';
import Proposal from './components/Proposal';
import IdentityPrompt from './components/IdentityPrompt';

function App() {
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#home">
          <img
            alt=""
            src="/logo.svg"
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          zkvote
        </Navbar.Brand>
        <Nav className="ml-auto">
          <Proposal />
          &nbsp;&nbsp;
          <IdentityPrompt />
        </Nav>
      </Navbar>
      <SubjectList />
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
    </div>
  );
}

export default App;
