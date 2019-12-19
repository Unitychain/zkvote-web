import React, { Component } from 'react';
import Web3 from 'web3'

class Wallet extends Component {
  constructor(props) {
    super(props);
    this.state = { account: '' }

    this.loadBlockChain = this.loadBlockChain.bind(this);
  }

  async loadBlockChain() {
    const web3 = new Web3(Web3.givenProvider)
    const network = await web3.eth.net.getNetworkType();
    console.log(network) // should give you main if you're connected to the main network via metamask...
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
  }

  componentDidMount() {
    this.loadBlockChain()
  }

  render() {
    return (
      <span style={{color: "white"}}>Your account: {this.state.account}</span>
    );
  }
}

export default Wallet;
