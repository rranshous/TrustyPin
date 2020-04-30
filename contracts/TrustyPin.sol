pragma solidity >=0.5.6 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract Constants {
  uint8 internal constant STATE_REQUESTED = 2;
}

contract TrustyPin is Constants {

  using SafeMath for uint;

  struct Pin {
    uint chunksAllocated;
    address owner;
    uint8 state;
  }

  mapping (string => Pin) pinsByContentHash;
  uint public chunksAvailable;
  string[] ipfsHashes;

  constructor() public {
    chunksAvailable = 100;
  }

  function addPin(string memory _ipfsHash, uint _chunksToAllocate) public {
    Pin memory pin = Pin(_chunksToAllocate, msg.sender, STATE_REQUESTED);
    chunksAvailable = chunksAvailable.sub(_chunksToAllocate, "Not enough chunksAvailable");
    ipfsHashes.push(_ipfsHash);
    pinsByContentHash[_ipfsHash] = pin;
  }

  function getPin(string memory _ipfsHash)
  public view returns (
    uint chunksAllocated, address owner, uint8 state
  ) {
    Pin storage pin = pinsByContentHash[_ipfsHash];
    return (pin.chunksAllocated, pin.owner, pin.state);
  }

  function getIpfsHashByIndex(uint _index) public view returns (string memory) {
    return ipfsHashes[_index];
  }
}

