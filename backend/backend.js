const contract = require("@truffle/contract");
const Web3 = require('web3');
const IpfsHttpClient = require('ipfs-http-client')

console.log("starting");
const RUN_INTERVAL=1000 * 30;

const backendUrl = process.env.WEB3_PROVIDER_URL || 'ws://localhost:8545';
const ipfsNodeUrl = process.env.IPFS_NODE_URL || 'http://localhost:5001';
console.log("backendUrl:", backendUrl);
console.log("ipfsNodeUrl:", ipfsNodeUrl);

const provider = new Web3.providers.WebsocketProvider(backendUrl)

const trustyPinDetails = require('../app/src/contracts/TrustyPin.json');
const TrustyPin = contract(trustyPinDetails);
TrustyPin.setProvider(provider);

const ipfs = IpfsHttpClient(ipfsNodeUrl);

let pins = {};
let inFlight = {};
let alreadyAdded = {};

const populateAlreadyAdded = async () => {
  console.log("populating existing ipfs pins");
  for await (let data of ipfs.pin.ls()) {
    if(data.type !== 'indirect') {
      alreadyAdded[data.cid.toString()] = true;
    }
  }
};

const updatePins = async () => {
  console.debug("updating pins");
  let deployed = await TrustyPin.deployed();
  let numberOfPins = await deployed.getNumberOfPins();
  console.debug("numberOfPins:", numberOfPins.toNumber());
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
  if(inFlight[ipfsHash]) {
    console.debug("skipping, already requested pin:", ipfsHash);
    return;
  } else if(alreadyAdded[ipfsHash]) {
    console.debug("skipping, already added pin:", ipfsHash);
    return;
  } else {
    console.info("pinning to ipfs:", ipfsHash);
  }
  inFlight[ipfsHash] = true;
  let r = await ipfs.pin.add(ipfsHash);
  delete inFlight[ipfsHash];
  alreadyAdded[ipfsHash] = true;
  console.info("done pinning to ifs:", r);
};

const run = async () => {
  console.log("running");
  await Promise.all(
    Object.entries(pins).map(([_,pin]) => {
      console.debug(`RequestedPin: ${pin.ipfsHash} (${pin.chunksAllocated}-${pin.pinner})`);
      return pinToIpfs(pin.ipfsHash);
    })
  );
};

let deployed = await TrustyPin.deployed();

deployed.events.PinAdded({}, (event) => {
  console.log("PinAdded event:", event);
  updatePins().then(run);
});

process.on('SIGINT', function() {
  console.debug("Caught interrupt signal, exiting");
  process.exit(1);
});

populateAlreadyAdded().then(() => {
  console.info("existing ifs pins:", Object.keys(alreadyAdded).length);

  try {
    console.debug("starting initial run");
    updatePins().then(run);
  } catch(err) {
    console.error("outside err:", err);
    process.exit(1);
  }

});

