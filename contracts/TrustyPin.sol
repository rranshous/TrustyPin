pragma solidity >=0.5.6 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
//import "@openzeppelin/contracts/access/Ownable.sol"; // onlyOwner

contract Constants {
  uint8 internal constant STATE_REQUESTED = 2;
}

contract TrustyPin is Constants {


  using SafeMath for uint;

  struct Pin {
    string ipfsHash;
    uint chunksAllocated;
    address owner;
    uint8 state;
  }

  mapping (string => Pin) pinsByContentHash;
  uint public chunksAvailable;
  string[] ipfsHashes;

  constructor() public {
    super;
    chunksAvailable = 0;
  }

  function addPin(string memory _ipfsHash, uint _chunksToAllocate) public {
    require(_chunksToAllocate > 0, 'No chunks allocated');
    Pin memory pin = Pin(_ipfsHash, _chunksToAllocate, msg.sender, STATE_REQUESTED);
    chunksAvailable = chunksAvailable.sub(_chunksToAllocate, "Not enough chunksAvailable");
    ipfsHashes.push(_ipfsHash);
    pinsByContentHash[_ipfsHash] = pin;
  }

  function removePin(string memory _ipfsHash) public {
    Pin storage pin = pinsByContentHash[_ipfsHash];
    require(pin.chunksAllocated > 0, 'Pin not found');
    chunksAvailable = chunksAvailable.add(pin.chunksAllocated);
  }

  function getPin(string memory _ipfsHash)
  public view returns (
    string memory ipfsHash, uint chunksAllocated, address owner, uint8 state
  ) {
    require(pinsByContentHash[_ipfsHash].chunksAllocated > 0, 'Pin not found');
    Pin storage pin = pinsByContentHash[_ipfsHash];
    return (pin.ipfsHash, pin.chunksAllocated, pin.owner, pin.state);
  }

  function getIpfsHashByIndex(uint _index) public view returns (string memory) {
    require(ipfsHashes.length > _index, 'Index too large');
    require(_index >= 0, 'Index below 0');
    return ipfsHashes[_index];
  }

  function getNumberOfPins() public view returns (uint) {
    return ipfsHashes.length;
  }

  function setChunksAvailable(uint _chunksAvailable) public {
    require(_chunksAvailable > 0, 'chunksAvailable must be more than 0');
    chunksAvailable = _chunksAvailable;
  }
}

