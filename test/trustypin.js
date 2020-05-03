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

  it("defaults new pin's state to requested", async () => {
    const pinDetails = await trustyPinInstance.getPin(ipfsHash);
    assert.equal(pinDetails.state, states.requested);
  });

  it("associates sender to pin as owner", async () => {
    const pinDetails = await trustyPinInstance.getPin(ipfsHash);
    assert.equal(pinDetails.owner, accounts[0]);
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
      trustyPinInstance.addPin(ipfsHash, 100, { from: accounts[0] }),
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

  it("allows owner to remove pin, returning allocated chunks", async () => {
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
});
