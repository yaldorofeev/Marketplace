//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './My721Contract.sol';
import './My1155Contract.sol';
import "@openzeppelin/contracts/utils/Counters.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
/* import "hardhat/console.sol"; */


contract MyMarket {
  using Counters for Counters.Counter;
  using SafeERC20 for IERC20;
  Counters.Counter private _tokenIds;
  Counters.Counter private _tradeIds;

  // In minutes
  uint public saleTime;

  // In minutes
  uint public auctionTime;

  uint256 public bidStep;

  My721Contract my721Contract;

  My1155Contract my1155Contract;

  IERC20 currencyTokens;

  struct TokenOnTrade {
    uint256 tokenId;
    address owner;
    bool onSale;
    bool onAuction;
    uint startTime;
    uint256 price;
    uint256 amountOnTrade;
    uint256 biddersCount;
    address lastBidder;
  }

  // Mapping from ID of sale/auction to sale position
  mapping(uint256 => TokenOnTrade) public onTrade;

  // Mapping from ID to cheking kind of token
  mapping(uint256 => bool) is1155Token;

  /* *
   * @dev Emitted when token(s) wiht `id` and with 'amount' created for 'owner'.
   */
  event Created (
    address indexed owner,
    uint256 id,
    uint256 amount
  );

  /* *
   * @dev Emitted when token(s) wiht `tokenId` and with 'amount' listed
   * on sale with 'tradeId' and 'price'.
   */
  event ListedOnSale (
    uint256 tradeId,
    uint256 tokenId,
    uint256 price,
    uint256 amount
  );

  /* *
   * @dev Emitted when token(s) wiht `tokenId` and with 'amount' listed
   * on auction with 'tradeId' and 'minPrice'.
   */
  event ListedOnAuction (
    uint256 tradeId,
    uint256 tokenId,
    uint256 minPrice,
    uint256 amount
  );

  /* *
   * @dev Emitted when 'bidder' make bid 'newPrice' in auction with 'tradeId'
   * on token(s) wiht `tokenId`.
   */
  event bidMade (
    uint256 tradeId,
    uint256 tokenId,
    uint256 newPrice,
    address bidder
  );

  /* *
   * @dev Emitted when token(s) wiht `tokenId` and with 'amount' was sold
   * by 'buyer'.
   */
  event Sold (
    uint256 id,
    uint256 amount,
    address buyer
    );


  /**
   * @dev constructor Everyone can vote, but only once.
   * @param _saleTime ID of the vote
   * @param _auctionTime addresses of candidates of the vote
   * @param _bidStep addresses of candidates of the vote
   * @param _721Contract addresses of candidates of the vote
   * @param _1155Contract addresses of candidates of the vote
   * @param _currencyContract of candidates of the vote
   */
  constructor(uint _saleTime, uint _auctionTime, uint256 _bidStep,
    address _721Contract, address _1155Contract,
    address _currencyContract) {
    require(address(_721Contract) != address(0),
    "Address of 721 contract can not be zero");
    require(address(_1155Contract) != address(0),
    "Address of 1155 contract can not be zero");
    require(address(_currencyContract) != address(0),
    "Address of currency contract can not be zero");
    require(_saleTime != 0, "Sale period can not be zero");
    require(_auctionTime != 0, "Auction period can not be zero");
    saleTime = _saleTime;
    auctionTime = _auctionTime;
    bidStep = _bidStep;

    my721Contract = My721Contract(_721Contract);
    my1155Contract = My1155Contract(_1155Contract);
    currencyTokens = IERC20(_currencyContract);
  }

  /**
   * @dev Mint token ERC721.
   * @param _tokenURI URI of token.
   */
  function createItem(string memory _tokenURI) public {
    _tokenIds.increment();
    uint256 newNftTokenId = _tokenIds.current();
    my721Contract.mint(msg.sender, newNftTokenId , _tokenURI);
    is1155Token[newNftTokenId] = false;
    emit Created(msg.sender, newNftTokenId, 1);
  }

  /**
   * @dev  Mint tokens ERC1155
   * @param _tokenURI  URI of tokens
   * @param _amount amount of tokens
   */
  function createItem(string memory _tokenURI, uint256 _amount) public {
    _tokenIds.increment();
    uint256 newNftTokenId = _tokenIds.current();
    my1155Contract.mint(msg.sender, newNftTokenId ,
      _amount, _tokenURI);
    is1155Token[newNftTokenId] = true;
    emit Created(msg.sender, newNftTokenId, _amount);
  }

  /**
   * @dev Function for ERC721 list on sale
   * @param _tokenId of token
   * @param _price of token
   */
  function listItem(uint256 _tokenId, uint256 _price) public  {
    require(_tokenId <= _tokenIds.current(), "Invalid token ID");
    require(!is1155Token[_tokenId],
      "To list this token you have to specify an amount of tokens");
    my721Contract.safeTransferFrom(msg.sender, address(this), _tokenId);
    _tradeIds.increment();
    onTrade[_tradeIds.current()] = TokenOnTrade(
      {
        tokenId: _tokenId,
        owner: msg.sender,
        onSale: true,
        onAuction: false,
        price: _price,
        startTime: block.timestamp,
        amountOnTrade: 1,
        biddersCount: 0,
        lastBidder: address(0)
      }
    );
    emit ListedOnSale(_tradeIds.current(),_tokenId, _price, 1);
  }

  /**
   * @dev Function for ERC1155 list on sale
   * @param _tokenId of token
   * @param _amount of token
   * @param _price of token
   */
  function listItem(uint256 _tokenId, uint256 _amount, uint256 _price) public {
    require(_tokenId <= _tokenIds.current(), "Invalid token ID");
    require(is1155Token[_tokenId],
      "To list this token you have not to specify an amount of tokens");
    my1155Contract.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, bytes(""));
    _tradeIds.increment();
    onTrade[_tradeIds.current()] = TokenOnTrade(
      {
        tokenId: _tokenId,
        owner: msg.sender,
        onSale: true,
        onAuction: false,
        price: _price,
        startTime: block.timestamp,
        amountOnTrade: _amount,
        biddersCount: 0,
        lastBidder: address(0)
      }
    );
    emit ListedOnSale(_tradeIds.current(), _tokenId, _price, _amount);
  }

  /**
   * @dev Function for buying ERC721
   * @param _tradeId of sale
   */
  function buyItem(uint256 _tradeId) public {
    TokenOnTrade storage tk = onTrade[_tradeId];
    require(!is1155Token[tk.tokenId],
      "To buy this token you have to specify an amount of tokens");
    require(tk.onSale, "The token is not on sale");
    require(block.timestamp < (tk.startTime + saleTime * 1 minutes),
      "The time of sale elapsed");
    my721Contract.safeTransferFrom(address(this), msg.sender, tk.tokenId);
    currencyTokens.safeTransferFrom(msg.sender, tk.owner, tk.price);
    tk.owner = msg.sender;
    tk.onSale = false;
    tk.amountOnTrade = 0;
    emit Sold(tk.tokenId, 1, msg.sender);
  }

  /**
   * @dev Function for buying ERC1155
   * @param _tradeId of sale
   * @param _amount of tokens
   */
  function buyItem(uint256 _tradeId, uint256 _amount) public {
    require(_amount != 0, "The amount can not be zero");
    TokenOnTrade storage tk = onTrade[_tradeId];
    require(is1155Token[tk.tokenId],
      "To buy this token you have not to specify an amount of tokens");
    require(tk.onSale, "The token is not on sale");
    require(block.timestamp < (tk.startTime + saleTime * 1 minutes) ,
      "The time of sale elapsed");
    require(tk.amountOnTrade >=  _amount, "Not enougth is tokens available now");
    my1155Contract.safeTransferFrom(address(this), msg.sender, tk.tokenId, _amount,  bytes(""));
    currencyTokens.safeTransferFrom(msg.sender, tk.owner, tk.price * _amount);
    tk.amountOnTrade -= _amount;
    if (tk.amountOnTrade == 0) {
      tk.onSale = false;
    }
    emit Sold(tk.tokenId, _amount, msg.sender);
  }

  /**
   * @dev Function cancel sale
   * @param _tradeId of sale
   */
  function cancel(uint256 _tradeId) public {
    TokenOnTrade storage tk = onTrade[_tradeId];
    require(msg.sender == tk.owner, "Only owner can cancel sale");
    require(tk.onSale, "The token is already not on sale");
    if (!is1155Token[tk.tokenId]) {
      my721Contract.safeTransferFrom(address(this), msg.sender, tk.tokenId);
    }
    else {
      my1155Contract.safeTransferFrom(address(this), msg.sender, tk.tokenId, tk.amountOnTrade,  bytes(""));
    }
    tk.onSale = false;
  }

  /**
   * @dev Function for ERC721 list on auction
   * @param _tokenId of token
   * @param _minPrice start price
   */
  function listItemOnAuction(uint256 _tokenId, uint256 _minPrice) public {
    require(_tokenId <= _tokenIds.current(), "Invalid token ID");
    require(!is1155Token[_tokenId],
      "To list this token you have to specify an amount of tokens");
    my721Contract.safeTransferFrom(msg.sender, address(this), _tokenId);
    _tradeIds.increment();
    onTrade[_tradeIds.current()] = TokenOnTrade(
      {
        tokenId: _tokenId,
        owner: msg.sender,
        onSale: false,
        onAuction: true,
        price: _minPrice,
        startTime: block.timestamp,
        amountOnTrade: 1,
        biddersCount: 0,
        lastBidder: address(0)
      }
    );
    emit ListedOnAuction(_tradeIds.current(), _tokenId, _minPrice, 1);
  }

  /**
   * @dev Function for ERC1155 list on auction
   * @param _tokenId of tokens
   * @param _amount of tokens
   * @param _minPrice start price
   */
  function listItemOnAuction(uint256 _tokenId, uint256 _amount, uint256 _minPrice) public {
    require(_tokenId <= _tokenIds.current(), "Invalid token ID");
    require(is1155Token[_tokenId],
      "To list this token you have not to specify an amount of tokens");
    my1155Contract.safeTransferFrom(msg.sender, address(this), _tokenId, _amount,  bytes(""));
    _tradeIds.increment();
    onTrade[_tradeIds.current()] = TokenOnTrade(
      {
        tokenId: _tokenId,
        owner: msg.sender,
        onSale: false,
        onAuction: true,
        price: _minPrice,
        startTime: block.timestamp,
        amountOnTrade: _amount,
        biddersCount: 0,
        lastBidder: address(0)
      }
    );
    emit ListedOnAuction(_tradeIds.current(), _tokenId, _minPrice, _amount);
  }

  /**
   * @dev Function for bid making
   * @param _tradeId of auction
   * @param _bid that make should be greater or equal than minPrice plus bid step
   */
  function makeBid(uint256 _tradeId, uint256 _bid) public {
    TokenOnTrade storage tk = onTrade[_tradeId];
    require(tk.onAuction, "This token/tokens is not on auction");
    require(block.timestamp <= tk.startTime + auctionTime * 1 minutes ,
      "The time of auction elapsed");
    require(_bid >= tk.price + bidStep, "A bid should be greater or equal than minPrice plus bid step");
    if (tk.lastBidder != address(0)) {
      currencyTokens.safeTransfer(tk.lastBidder,
        tk.price);
    }
    tk.price = _bid;
    currencyTokens.safeTransferFrom(msg.sender, address(this),
      tk.price);
    tk.biddersCount += 1;
    tk.lastBidder = msg.sender;
    emit bidMade(_tradeId, tk.tokenId, tk.price, msg.sender);
  }

  /**
   * @dev Finish auction
   * @param _tradeId of auction
   */
  function finishAuction(uint256 _tradeId) public {
    TokenOnTrade storage tk = onTrade[_tradeId];
    require(tk.onAuction, "The token/tokens is already not on auction");
    if (((msg.sender == tk.owner) && (tk.biddersCount == 0)) || ((tk.biddersCount < 2) &&
      (block.timestamp > (tk.startTime + auctionTime * 1 minutes)))) {
      if (tk.lastBidder != address(0)) {
        currencyTokens.safeTransfer(tk.lastBidder, tk.price);
      }
      if (!is1155Token[tk.tokenId]) {
        my721Contract.safeTransferFrom(address(this), tk.owner, tk.tokenId);
      }
      else {
        my1155Contract.safeTransferFrom(address(this), tk.owner, tk.tokenId,
          tk.amountOnTrade, bytes(""));
      }
      tk.onAuction = false;
    }
    else {
      require(block.timestamp > (tk.startTime + auctionTime * 1 minutes),
        "The time of auction is not elapsed yet");
      if (!is1155Token[tk.tokenId]) {
        my721Contract.safeTransferFrom(address(this), tk.lastBidder, tk.tokenId);
      }
      else {
        my1155Contract.safeTransferFrom(address(this), tk.lastBidder, tk.tokenId,
          tk.amountOnTrade, bytes(""));
      }
      tk.onAuction = false;
      currencyTokens.safeTransfer(tk.owner, tk.price);
      emit Sold(tk.tokenId, tk.amountOnTrade, tk.lastBidder);
    }
  }

  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
    )external returns(bytes4) {
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes calldata
    )external returns(bytes4) {
    return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
  }
}
