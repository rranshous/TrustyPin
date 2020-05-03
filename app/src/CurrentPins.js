import React, { Component } from "react";
import Pin from "./Pin"

// leaning on https://github.com/trufflesuite/drizzle/blob/develop/packages/react-components/src/new-context-api/ContractData.js

class CurrentPins extends Component {

  constructor(props, context) {
    super(props);

		let contract = this.props.drizzle.contracts.TrustyPin;
    this.state = {
      numberOfPins: {
        dataKey: contract.methods.getNumberOfPins.cacheCall(),
      },
      ipfsHashes: []
    };
  }

	componentDidUpdate(prevProps, prevState) {
    // TODO: put in condition
    if(!this.numberOfPinsLoaded()) {
      return;
    }
    let numberOfPins = this.numberOfPins();
    let numberOfHashes = this.state.ipfsHashes.length;
    if(numberOfHashes == numberOfPins) {
      return;
    }
    let ipfsHashes = [];
    for(let i=0; i<numberOfPins; i++) {
      if(!this.state.ipfsHashes[i]) {
        ipfsHashes.push({
          dataKey: this.props.drizzle.contracts.TrustyPin.methods.getIpfsHashByIndex.cacheCall(i),
        });
      } else {
        ipfsHashes.push(this.state.ipfsHashes[i]);
      }
    }
    let newState = {
      ...this.state,
      ipfsHashes
    };
    this.setState(newState);
	}

  contract = () => {
    return this.props.drizzleState.contracts.TrustyPin;
  };

  numberOfPinsLoaded = () => {
    return this.state.numberOfPins.dataKey in this.contract().getNumberOfPins
  };

  numberOfPins = () => {
    if(!this.numberOfPinsLoaded()) { return null; }
    return this.contract().getNumberOfPins[this.state.numberOfPins.dataKey].value;
  };

  ipfsHashLoaded = (index) => {
    if(!this.state.ipfsHashes[index]) { return false; }
    return this.state.ipfsHashes[index].dataKey in this.contract().getIpfsHashByIndex;
  };

  ipfsHashesLoaded = () => {
    if(!this.numberOfPinsLoaded()) { return false; }
    for(let i=0; i<this.numberOfPins(); i++) {
      if(!this.ipfsHashLoaded(i)) { return false; }
    };
    return true;
  };

  ipfsHashValue = (index) => {
    let dataKey = this.state.ipfsHashes[index].dataKey;
    return this.contract().getIpfsHashByIndex[dataKey].value;
  };

  contractInitialized = () => {
    return this.contract().initialized;
  };

  contractSynced = () => {
    return this.contract().synced
  };

	render() {

    // Contract is not yet intialized.
    if (!this.contractInitialized()) {
      return <span>Initializing...</span>;
    }

    // If the cache key we received earlier isn't in the store yet; the initial value is still being fetched.
    if (!this.numberOfPinsLoaded()) {
      return <span>Fetching pin count...</span>;
    }

    // Show a loading spinner for future updates.
    let pendingSpinner = this.contractSynced() ? "" : " 🔄";

    let numberOfPins = this.numberOfPins();

    if(!this.ipfsHashesLoaded()) {
      return <span>Fetching ipfs hashes</span>;
    }

    let pinsOut=[];
    for(let i=0; i<numberOfPins; i++) {
      pinsOut.push(
        <Pin
          key={this.ipfsHashValue(i)}
          ipfsHash={this.ipfsHashValue(i)}
          drizzle={this.props.drizzle}
          drizzleState={this.props.drizzleState}
        />);
    }

    return (
      <div>
      {pinsOut}
      {pendingSpinner}
      </div>
    );

  }

}

export default CurrentPins;
