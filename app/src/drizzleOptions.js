import Web3 from "web3";
import TrustyPin from "./contracts/TrustyPin.json";

const options = {
  web3: {
    block: false,
    customProvider: new Web3("ws://localhost:8545"),
  },
  contracts: [TrustyPin],
  events: {
  },
};

export default options;
