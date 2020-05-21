import React, { Component } from "react";

class Pin extends Component {

  constructor(props, context) {
    super(props);

		let contract = this.props.drizzle.contracts.TrustyPin;
    this.state = {
      getPin: {
        dataKey: contract.methods.getPin.cacheCall(props.ipfsHash),
      }
    };
  }

  contract = () => {
    return this.props.drizzleState.contracts.TrustyPin;
  };

  pinLoaded = () => {
    return (this.state.getPin.dataKey in this.contract().getPin) && this.pinData();
  };

  pinData = () => {
    return this.contract().getPin[this.state.getPin.dataKey].value;
  };

  render() {
    if(!this.contract().initialized) {
      return <span>Initializing...</span>;
    }

    if(!this.pinLoaded()) {
      return <span>Fetching</span>;
    }

    return (
      <div className="pin">
        <div className="ipfs-hash">
          <label>ipfsHash:</label>
          <a href={'ipfs://' + this.pinData().ipfsHash}>{this.pinData().ipfsHash}</a>
        </div>
        <div className="chunks-allocated">
          <label>chunksAllocated:</label>{this.pinData().chunksAllocated}
        </div>
        <div className="pinner">
          <label>pinner:</label>{this.pinData().pinner}
        </div>
        <div className="state">
          <label>state:</label>{this.pinData().state}
        </div>
      </div>
    );
  }

}

export default Pin;
