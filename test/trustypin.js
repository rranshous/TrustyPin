const Web3Utils = require('web3-utils');
const { Keccak } = require('sha3');
const TrustyPin = artifacts.require("TrustyPin");
const truffleAssert = require('truffle-assertions');

const states = {
  requested: 2
};

contract("TrustyPin", accounts => {
  let ipfsHash = "testHash",
    ipfsHash2 = "testHash2",
    initialChunksAvailable = 100,
    chunksToAllocate = 32,
    contractChunksAvailable,
    trustyPinInstance;

  beforeEach(async () => {
    trustyPinInstance = await TrustyPin.deployed();
    contractChunksAvailable = await trustyPinInstance.chunksAvailable();
  });

  it("publishes chunk size", async () => {
    let chunkSize = await trustyPinInstance.chunkSize();
    assert.equal(chunkSize, 1000000);
  });

  it("can update chunksAvailable", async () => {
    let chunksAvailable = await trustyPinInstance.chunksAvailable();
    assert.equal(chunksAvailable, 0); // default
    await trustyPinInstance.setChunksAvailable(initialChunksAvailable, { from: accounts[0] });
    assert.equal(await trustyPinInstance.chunksAvailable(), initialChunksAvailable);
  });

  it("can add and retrieve pins", async () => {
    await trustyPinInstance.addPin(ipfsHash, chunksToAllocate, { from: accounts[0] });
    const pinDetails = await trustyPinInstance.getPin(ipfsHash);
    assert.equal(pinDetails.chunksAllocated, 32);
  });

  it("errors if you try and add an existing pin", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.addPin(ipfsHash, chunksToAllocate, { from: accounts[0] }),
      'Pin already exists'
    );
  });

  it("only allows authorized pinners to add pins", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.addPin(ipfsHash2, chunksToAllocate, { from: accounts[1] }),
      'Account not authorized to pin'
    );
  });

  it("defaults new pin's state to requested", async () => {
    const pinDetails = await trustyPinInstance.getPin(ipfsHash);
    assert.equal(pinDetails.state, states.requested);
  });

  it("lets you update pin to served state", async () => {
    await trustyPinInstance.setPinState(ipfsHash, 4);
    let pin = await trustyPinInstance.getPin(ipfsHash)
    assert.equal(4, pin.state);
  });

  it("knows if its served", async () => {
    let served = await trustyPinInstance.isServed(ipfsHash);
    assert.equal(true, served);
  });

  it("can update pin state to too big", async () => {
    await trustyPinInstance.setPinState(ipfsHash, 8);
    let pin = await trustyPinInstance.getPin(ipfsHash)
    assert.equal(8, pin.state);
  });

  it("associates sender to pin as pinner", async () => {
    const pinDetails = await trustyPinInstance.getPin(ipfsHash);
    assert.equal(pinDetails.pinner, accounts[0]);
  });

  it("sets chunksAllocated on pin", async () => {
    const pinDetails = await trustyPinInstance.getPin(ipfsHash);
    assert.equal(pinDetails.chunksAllocated, chunksToAllocate);
  });

  it("reduces available chunks with each added pin", async () => {
    const remainingChunks = await trustyPinInstance.chunksAvailable();
    assert.equal(remainingChunks, initialChunksAvailable - chunksToAllocate);
  });

  it("rejects transactions which would dip chunksAvailable below 0", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.addPin(ipfsHash2, 100, { from: accounts[0] }),
      "Not enough chunksAvailable"
    );
  });

  it("can track more than one pin", async () => {
    await trustyPinInstance.addPin(ipfsHash2, chunksToAllocate, { from: accounts[0] });
    let numberOfPins = await trustyPinInstance.getNumberOfPins();
    assert.equal(numberOfPins.toNumber(), 2);
    let pin1 = await trustyPinInstance.getPin(ipfsHash);
    let pin2 = await trustyPinInstance.getPin(ipfsHash2);
    assert.equal(pin1.ipfsHash, ipfsHash);
    assert.equal(pin1.chunksAllocated, chunksToAllocate);
    assert.equal(pin2.ipfsHash, ipfsHash2);
    assert.equal(pin2.chunksAllocated, chunksToAllocate);
  });

  it("enumerates ipfsHashes", async () => {
    let expectedIpfsHashes = [ipfsHash, ipfsHash2];
    let numberOfPins = await trustyPinInstance.getNumberOfPins();
    for(let i=0; i<numberOfPins; i++) {
      let ipfsHash = await trustyPinInstance.getIpfsHashByIndex(i);
      assert.equal(ipfsHash, expectedIpfsHashes[i]);
    }
  });

  it("allows pinner to remove pin, returning allocated chunks", async () => {
    let chunksAvailable = await trustyPinInstance.chunksAvailable();
    let pin = await trustyPinInstance.getPin(ipfsHash2);
    let pinnedChunks = pin.chunksAllocated;
    assert.equal(chunksAvailable.toNumber(), initialChunksAvailable - chunksToAllocate * 2);
    await  trustyPinInstance.removePin(ipfsHash2, { from: accounts[0] })
    chunksAvailable = await trustyPinInstance.chunksAvailable();
    assert.equal(chunksAvailable.toNumber(), contractChunksAvailable.toNumber() + chunksToAllocate);
    assert.equal(await trustyPinInstance.getNumberOfPins(), 1);
    await truffleAssert.reverts(
      trustyPinInstance.getIpfsHashByIndex(1),
      "Index too large"
    );
    await truffleAssert.reverts(
      trustyPinInstance.getPin(ipfsHash2),
      "Pin not found"
    );
  });

  it("only allows pinner to remove pin", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.removePin(ipfsHash, { from: accounts[1] }),
      'Account not authorized to remove pin'
    );
  });

  it("can be queried if address is an authorized pinner", async () => {
    assert.isTrue(await trustyPinInstance.isAuthorizedPinner(accounts[0]));
    assert.isFalse(await trustyPinInstance.isAuthorizedPinner(accounts[1]));
  })

  it("allows owner to add a new pinner", async () => {
    await trustyPinInstance.addAuthorizedPinner(accounts[1], { from: accounts[0] });
    assert.isTrue(await trustyPinInstance.isAuthorizedPinner(accounts[1]));
  });

  it("only allows owner to add new pinner", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.addAuthorizedPinner(accounts[2], { from: accounts[1] }),
      'Account not authorized to add pinner'
    );
  });

  it("allows owner to remove pinner", async () => {
    await trustyPinInstance.removeAuthorizedPinner(accounts[1], { from: accounts[0] });
    assert.isFalse(await trustyPinInstance.isAuthorizedPinner(accounts[1]));
  });

  it("only allows owner to remove pinner", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.removeAuthorizedPinner(accounts[1], { from: accounts[1] }),
      'Account not authorized to remove pinner'
    );
  });

  it("error if removing pinner who is not already authorized", async () => {
    await truffleAssert.reverts(
      trustyPinInstance.removeAuthorizedPinner(accounts[3], { from: accounts[0] }),
      'Pinner not already authorized'
    );
  });

  it("events when a new pin is added", async () => {
    let ipfsHash2Kec = Web3Utils.sha3(ipfsHash2);
    let result = await trustyPinInstance.addPin(ipfsHash2, chunksToAllocate, { from: accounts[0] })
    await truffleAssert.eventEmitted(result, 'PinAdded', (event) => {
      return event.ipfsHash == ipfsHash2 &&
             event.ipfsHashSha3 == ipfsHash2Kec &&
             event.chunksAllocated == chunksToAllocate &&
             event.pinner == accounts[0];
    });
  });

  it("events when a pin is removed", async () => {
    let ipfsHash2Kec = Web3Utils.sha3(ipfsHash2);
    let result = await trustyPinInstance.removePin(ipfsHash2, { from: accounts[0] })
    await truffleAssert.eventEmitted(result, 'PinRemoved', (event) => {
      return event.ipfsHashSha3 == ipfsHash2Kec &&
             event.removedBy == accounts[0];
    });
  });
});
