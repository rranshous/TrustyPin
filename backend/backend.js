const contract = require("@truffle/contract");
const Web3 = require('web3');
const IpfsHttpClient = require('ipfs-http-client')

console.log("starting");

const backendUrl = 'ws://localhost:8545'; // testing
const provider = new Web3.providers.WebsocketProvider(backendUrl)

const trustyPinDetails = require('../app/src/contracts/TrustyPin.json');
const TrustyPin = contract(trustyPinDetails);
TrustyPin.setProvider(provider);

const ipfs = IpfsHttpClient('http://localhost:5001')

let pins = {};

const updatePins = async () => {
  console.log("updaing pins");
  let deployed = await TrustyPin.deployed();
  let numberOfPins = await deployed.getNumberOfPins();
  console.info("numberOfPins:", numberOfPins.toNumber());
  pins = {}; // TODO: not clear just update + clean
  for(let i=0; i<numberOfPins; i++) {
    let ipfsHash = await deployed.getIpfsHashByIndex(i);
    console.info(i, ipfsHash);
    let pin = await deployed.getPin(ipfsHash);
    pins[pin.ipfsHash] = pin;
  }
  return pins;
};

const pinToIpfs = async (ipfsHash) => {
  console.info("pinning to ipfs:", ipfsHash);
  let r = await ipfs.pin.add(ipfsHash);
  console.log("done pinning to ifs:", r);
};

const run = async () => {
  console.log("running");
  await Promise.all(
    Object.entries(pins).map(([_,pin]) => {
      console.log(`Pin: ${pin.ipfsHash} (${pin.chunksAllocated}-${pin.pinner})`);
      return pinToIpfs(pin.ipfsHash);
    })
  );
};

updatePins().then(run).then(process.exit);
