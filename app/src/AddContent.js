import React, { Component } from "react";
import Pin from "./Pin"
import Ipfs from 'ipfs'

// leaning on https://github.com/trufflesuite/drizzle/blob/develop/packages/react-components/src/new-context-api/ContractData.js

const ipfsNodeUrl = process.env.IPFS_NODE_URL || 'http://localhost:5001';
console.log("ipfsNodeUrl:", ipfsNodeUrl);

class AddContent extends Component {

  constructor(props, context) {
    super(props);
    this.state = { content: '' };
    this.ipfs = null;	
    this.startIpfs();
  };

  startIpfs = async () => {
		if (this.ipfs) {
			console.log('IPFS already started')
		} else if (window.ipfs && window.ipfs.enable) {
			console.log('Found window.ipfs')
			this.ipfs = await window.ipfs.enable({ commands: ['add'] })
		} else {
			try {
				console.time('IPFS Started')
				this.ipfs = await Ipfs.create()
				console.timeEnd('IPFS Started')
			} catch (error) {
				console.error('IPFS init error:', error)
				this.ipfs = null
			}
		}
	};

  contract = () => {
    return this.props.drizzle.contracts.TrustyPin;
  };

  addPinToContract = async (ipfsHash) => {
    console.log("adding pin to contract:", ipfsHash);
    let contract = this.contract();
    console.log("contract:", contract);
    let result = contract.methods.addPin.cacheSend(
      ipfsHash, 1, { gas: 3000000 }
    );
    console.log("adding pin to contract result:", result);
  };

  handlePublishClick = async () => {
    console.log("publish clicked:", this.state.content);
    let buffer = Buffer.from(this.state.content);
    let result = await this.ipfs.add(buffer);
    let ipfsHash = null;
    for await (let r of result) {
      ipfsHash = r.path;
    }
    await this.addPinToContract(ipfsHash);
    console.log("done publishing", ipfsHash);
  };

  handleContentChange = ({ target: el }) => {
    console.log("updating content in state:", el.value);
    this.setState({ content: el.value });
  };

  render() {
    return (<div>
      <input type="textarea" id="newContent"
             value={this.state.content}
             onChange={this.handleContentChange}/>
      <br/>
      <button onClick={this.handlePublishClick}>Publish</button>
    </div>
    );
  }
}

export default AddContent;
