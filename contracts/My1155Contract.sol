//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract My1155Contract is ERC1155URIStorage, Ownable {

  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  constructor(string memory name_, string memory symbol_) ERC1155("") {
    _name = name_;
    _symbol = symbol_;
  }

  /**
   * @dev Get name of the contract.
   * @return string with name of the contract.
   */
  function name() public view returns (string memory) {
      return _name;
  }

  /**
   * @dev Get symbol of the contract.
   * @return string with symbol of the contract.
   */
  function symbol() public view returns (string memory) {
      return _symbol;
  }

  function mint(address _receiver, uint256 _tokenId, uint256 _amount,
     string memory _tokenURI) external onlyOwner {
      _mint(_receiver, _tokenId, _amount, bytes(_tokenURI));
      _setURI(_tokenId, _tokenURI);
  }
}
