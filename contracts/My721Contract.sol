//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract My721Contract is ERC721URIStorage, Ownable {

  constructor() ERC721("SuperNFT721", "SN721") {

  }

  function mint(address receiver, uint256 _tokenId, string memory tokenURI)
    external onlyOwner {
    _safeMint(receiver, _tokenId);
    _setTokenURI(_tokenId, tokenURI);
  }

}
