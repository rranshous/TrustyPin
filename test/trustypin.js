const TrustyPin = artifacts.require("TrustyPin");
const truffleAssert = require('truffle-assertions');

const states = {
  requested: 2
};

contract("TrustyPin", accounts => {
  let ipfsHash = "testHash",
    chunksToAllocate = 32,
    initialRemainingChunks;

  it("can add and retrieve pins", async () => {
    const trustyPinInstance = await TrustyPin.deployed();
    initialRemainingChunks = await trustyPinInstance.chunksAvailable();

    await trustyPinInstance.addPin(ipfsHash, chunksToAllocate, { from: accounts[0] });

    const pinDetails = await trustyPinInstance.getPin.call(ipfsHash);

    assert.equal(pinDetails.chunksAllocated, 32);
  });

  it("defaults new pin's state to requested", async () => {
    const trustyPinInstance = await TrustyPin.deployed();
    const pinDetails = await trustyPinInstance.getPin.call(ipfsHash);

    assert.equal(pinDetails.state, states.requested);
  });

  it("associates sender to pin as owner", async () => {
    const trustyPinInstance = await TrustyPin.deployed();
    const pinDetails = await trustyPinInstance.getPin.call(ipfsHash);

    assert.equal(pinDetails.owner, accounts[0]);
  });

  it("reduces available chunks with each added pin", async () => {
    const trustyPinInstance = await TrustyPin.deployed();
    const remainingChunks = await trustyPinInstance.chunksAvailable();
    let expectedChunks = initialRemainingChunks - chunksToAllocate;

    assert.equal(remainingChunks, expectedChunks);
  });

  it("rejects transactions which would dip chunksAvailable below 0", async () => {
    const trustyPinInstance = await TrustyPin.deployed();
    initialRemainingChunks = await trustyPinInstance.chunksAvailable();

    await truffleAssert.reverts(
      trustyPinInstance.addPin(ipfsHash, 100, { from: accounts[0] }),
      "Not enough chunksAvailable"
    );
  });

  it("enumerates ipfsHashes", async () => {
    const trustyPinInstance = await TrustyPin.deployed();
    let ipfsHash2 = "testHash2";
    await trustyPinInstance.addPin(ipfsHash2, chunksToAllocate, { from: accounts[0] });
    let expectedIpfsHashes = [ipfsHash, ipfsHash2];

    for(let i=0; i<2; i++) {
      let ipfsHash = await trustyPinInstance.getIpfsHashByIndex(i);
      assert.equal(ipfsHash, expectedIpfsHashes[i]);
    }
  });
});
