pragma solidity >=0.5.6 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract Constants {
  uint8 internal constant STATE_REQUESTED = 2;
}

contract TrustyPin is Constants {

  using SafeMath for uint;

  struct Pin {
    string ipfsHash;
    uint chunksAllocated;
    address pinner;
    uint8 state;
    uint enumIndex;
  }

  address private owner;
  mapping (string => Pin) pinsByContentHash;
  string[] ipfsHashes;
  mapping (address => bool) authorizedPinners;
  uint public chunksAvailable;

  constructor() public {
    super;
    owner = msg.sender;
    chunksAvailable = 0;
    authorizedPinners[msg.sender] = true;
  }

  function addPin(string memory _ipfsHash, uint _chunksToAllocate) public {
    require(_chunksToAllocate > 0, 'No chunks allocated');
    require(authorizedPinners[msg.sender], 'Account not authorized to pin');
    require(pinsByContentHash[_ipfsHash].chunksAllocated == 0, 'Pin already exists');
    Pin memory pin = Pin(_ipfsHash, _chunksToAllocate, msg.sender, STATE_REQUESTED, ipfsHashes.length);
    chunksAvailable = chunksAvailable.sub(_chunksToAllocate, "Not enough chunksAvailable");
    ipfsHashes.push(_ipfsHash);
    pinsByContentHash[_ipfsHash] = pin;
  }

  function removePin(string memory _ipfsHash) public {
    Pin storage pin = pinsByContentHash[_ipfsHash];
    require(pin.chunksAllocated > 0, 'Pin not found');
    require(pin.pinner == msg.sender, 'Account not authorized to remove pin');

    // return alloted storage chunks
    chunksAvailable = chunksAvailable.add(pin.chunksAllocated);

    // remove the pin's entry from the ipfsHashes array
    assert(pin.enumIndex < ipfsHashes.length);
    ipfsHashes[pin.enumIndex] = ipfsHashes[ipfsHashes.length-1];
    delete ipfsHashes[ipfsHashes.length-1];
    ipfsHashes.length--;
    Pin storage pinToMove = pinsByContentHash[ipfsHashes[ipfsHashes.length-1]];
    assert(pinToMove.chunksAllocated > 0);
    pinToMove.enumIndex = pin.enumIndex;

    // remove pin entry from mapping
    delete pinsByContentHash[_ipfsHash];
  }

  function addAuthorizedPinner(address _addr) public {
    require(owner == msg.sender, 'Account not authorized to add pinner');
    authorizedPinners[_addr] = true;
  }

  function removeAuthorizedPinner(address _addr) public {
    require(owner == msg.sender, 'Account not authorized to remove pinner');
    require(authorizedPinners[_addr] == true, 'Pinner not already authorized');
    delete authorizedPinners[_addr];
  }

  function setChunksAvailable(uint _chunksAvailable) public {
    require(_chunksAvailable > 0, 'chunksAvailable must be more than 0');
    chunksAvailable = _chunksAvailable;
  }

  function getPin(string memory _ipfsHash)
  public view returns (
    string memory ipfsHash, uint chunksAllocated, address pinner, uint8 state
  ) {
    require(pinsByContentHash[_ipfsHash].chunksAllocated > 0, 'Pin not found');
    Pin storage pin = pinsByContentHash[_ipfsHash];
    return (pin.ipfsHash, pin.chunksAllocated, pin.pinner, pin.state);
  }

  function getIpfsHashByIndex(uint _index) public view returns (string memory) {
    require(ipfsHashes.length > _index, 'Index too large');
    require(_index >= 0, 'Index below 0');
    return ipfsHashes[_index];
  }

  function getNumberOfPins() public view returns (uint) {
    return ipfsHashes.length;
  }

  function isAuthorizedPinner(address _addr) public view returns (bool) {
    return (authorizedPinners[_addr]);
  }
}

