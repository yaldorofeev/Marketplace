import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";
import * as dotenv from "dotenv";

describe("MyMarket", function () {

  let myMarket: Contract;
  let my721Contract: Contract;
  let my1155Contract: Contract;
  let stContract: Contract;
  let accounts: Signer[];

  let saleTime = 10;
  let auctionTime = 10;
  let bidStep = 100;

  //account[0] is owner, 3 other -buers and sellers (user1, user2, user3)
  // token 1 (721) in trades: 1, 3, 4
  // token 2 (1155)in trades: 2, 5
  // token 3 (721) in trades: 6, 8
  // token 4 (1155) in trades: 7, 9


  it("Should test reverts of constructor", async function () {
    const MyMarket = await ethers.getContractFactory("MyMarket");
    await expect(MyMarket.deploy(saleTime, auctionTime, bidStep,
                                      ethers.constants.AddressZero,
                                      process.env.ERC1155_CONTRACT!,
                                      process.env.SUPER_TOKEN_CONTRACT!))
      .to.be.revertedWith("Address of 721 contract can not be zero");
    await expect(MyMarket.deploy(saleTime, auctionTime, bidStep,
                                      process.env.ERC721_CONTRACT!,
                                      ethers.constants.AddressZero,
                                      process.env.SUPER_TOKEN_CONTRACT!))
      .to.be.revertedWith("Address of 1155 contract can not be zero");
    await expect(MyMarket.deploy(saleTime, auctionTime, bidStep,
                                      process.env.ERC721_CONTRACT!,
                                      process.env.ERC1155_CONTRACT!,
                                      ethers.constants.AddressZero))
      .to.be.revertedWith("Address of currency contract can not be zero");
    await expect(MyMarket.deploy(0, auctionTime, bidStep,
                                      process.env.ERC721_CONTRACT!,
                                      process.env.ERC1155_CONTRACT!,
                                      process.env.SUPER_TOKEN_CONTRACT!))
      .to.be.revertedWith("Sale period can not be zero");
    await expect(MyMarket.deploy(saleTime, 0, bidStep,
                                      process.env.ERC721_CONTRACT!,
                                      process.env.ERC1155_CONTRACT!,
                                      process.env.SUPER_TOKEN_CONTRACT!))
      .to.be.revertedWith("Auction period can not be zero");
  });

  it("Should deploy contract", async function () {
    const MyMarket = await ethers.getContractFactory("MyMarket");
     myMarket = await MyMarket.deploy(saleTime, auctionTime, bidStep,
                                       process.env.ERC721_CONTRACT!,
                                       process.env.ERC1155_CONTRACT!,
                                       process.env.SUPER_TOKEN_CONTRACT!);
    await myMarket.deployed();
  });

  it("Should change owners of ERC contracts", async function () {
    accounts = await ethers.getSigners();
    my721Contract = await ethers.getContractAt("My721Contract",
                              process.env.ERC721_CONTRACT!,
                              accounts[0]);
    await expect(my721Contract.transferOwnership(myMarket.address))
      .to.emit(my721Contract, "OwnershipTransferred")
      .withArgs(await accounts[0].getAddress(), myMarket.address);

    my1155Contract = await ethers.getContractAt("My1155Contract",
                              process.env.ERC1155_CONTRACT!,
                              accounts[0]);
    await expect(my1155Contract.transferOwnership(myMarket.address))
      .to.emit(my1155Contract, "OwnershipTransferred")
      .withArgs(await accounts[0].getAddress(), myMarket.address);

    stContract = await ethers.getContractAt("IERC20_MY",
                              process.env.SUPER_TOKEN_CONTRACT!,
                              accounts[0]);
  });

  it("Test create 721 token by user1", async function () {
    const contract = myMarket.connect(accounts[1]);
    await expect(contract["createItem(string)"]("URI"))
    .to.emit(myMarket, "Created")
    .withArgs(await accounts[1].getAddress(), 1, 1);
  });

  it("Test create 1155 token by user1", async function () {
    const contract = myMarket.connect(accounts[1]);
    await expect(contract["createItem(string,uint256)"]("URI", 100))
    .to.emit(myMarket, "Created")
    .withArgs(await accounts[1].getAddress(), 2, 100);
  });

  it("Test reverts of list on sale 721 token", async function () {
    my721Contract.connect(accounts[1]).approve(myMarket.address, 1);
    const contract = myMarket.connect(accounts[1]);
    await expect(contract["listItem(uint256,uint256)"]
    (404, ethers.BigNumber.from('20000000')))
    .to.be.revertedWith("Invalid token ID");
    await expect(contract["listItem(uint256,uint256)"]
    (2, ethers.BigNumber.from('20000000')))
    .to.be.revertedWith("To list this token you have to specify an amount of tokens");
  });

  it("Test list on sale 721 token by user1", async function () {
    my721Contract.connect(accounts[1]).approve(myMarket.address, 1);
    const contract = myMarket.connect(accounts[1]);
    await expect(contract["listItem(uint256,uint256)"]
    (1, ethers.BigNumber.from('20000000')))
    .to.emit(myMarket, "ListedOnSale")
    .withArgs(1, 1, ethers.BigNumber.from('20000000'), 1);
  });

  it("Test reverts of list on sale 1155 token", async function () {
    my1155Contract.connect(accounts[1])
      .setApprovalForAll(myMarket.address, true);
    const contract = myMarket.connect(accounts[1]);
    await expect(contract["listItem(uint256,uint256,uint256)"]
    (404, 100, ethers.BigNumber.from('20000000')))
    .to.be.revertedWith("Invalid token ID");
    await expect(contract["listItem(uint256,uint256,uint256)"]
    (1, 100, ethers.BigNumber.from('20000000')))
    .to.be.revertedWith("To list this token you have not to specify an amount of tokens");
  });

  it("Test list on sale 1155 token by user1", async function () {
    my1155Contract.connect(accounts[1])
      .setApprovalForAll(myMarket.address, true);
    const contract = myMarket.connect(accounts[1]);
    await expect(contract["listItem(uint256,uint256,uint256)"]
    (2, 100, ethers.BigNumber.from('20000000')))
    .to.emit(myMarket, "ListedOnSale")
    .withArgs(2, 2, ethers.BigNumber.from('20000000'), 100);
  });

  it("Test reverts of buying 721 token by user2", async function () {
    const contract = myMarket.connect(accounts[2]);
    await expect(contract["buyItem(uint256)"]
    (2)).to.be
      .revertedWith("To buy this token you have to specify an amount of tokens");
    await expect(contract["buyItem(uint256)"]
    (3)).to.be
      .revertedWith("The token is not on sale");
    await ethers.provider.send('evm_increaseTime', [10 * 60]);
    await ethers.provider.send('evm_mine', []);
    await expect(contract["buyItem(uint256)"]
    (1)).to.be
      .revertedWith("The time of sale elapsed");
  });

  it("Now the sale of token 1 is overdue, so we can test cancel", async function () {
    await expect(myMarket.connect(accounts[2])["cancel(uint256)"]
    (1)).to.be
      .revertedWith("Only owner can cancel sale");
    await myMarket.connect(accounts[1])["cancel(uint256)"](1);
    await expect(myMarket.connect(accounts[1])["cancel(uint256)"]
    (1)).to.be.revertedWith("The token is already not on sale");
  });

  it("Test buying 721 token by user2 (user1 re-list token)", async function () {
    my721Contract.connect(accounts[1]).approve(myMarket.address, 1);
    await expect(myMarket.connect(accounts[1])["listItem(uint256,uint256)"]
    (1, ethers.BigNumber.from('20000000')))
    .to.emit(myMarket, "ListedOnSale")
    .withArgs(3, 1, ethers.BigNumber.from('20000000'), 1);
    const contract = myMarket.connect(accounts[2]);
    const trade = await contract.onTrade(3);
    const price = trade["price"];
    const tokenId = trade["tokenId"];
    await stContract.connect(accounts[2]).approve(myMarket.address, price);
    await expect(contract["buyItem(uint256)"](3))
    .to.emit(contract, "Sold")
    .withArgs(tokenId, 1, await accounts[2].getAddress);
  });

  it("User2 re-list token for futher tests", async function () {
    my721Contract.connect(accounts[2]).approve(myMarket.address, 1);
    await expect(myMarket.connect(accounts[2])["listItem(uint256,uint256)"]
    (1, ethers.BigNumber.from('200000')))
    .to.emit(myMarket, "ListedOnSale")
    .withArgs(4, 1, ethers.BigNumber.from('200000'), 1);
  });

  it("Test reverts of buying 1155 token by user2", async function () {
    const contract = myMarket.connect(accounts[2]);
    await expect(contract["buyItem(uint256,uint256)"]
    (2, 0)).to.be
      .revertedWith("The amount can not be zero");
    await expect(contract["buyItem(uint256,uint256)"]
    (3, 5)).to.be
      .revertedWith("To buy this token you have not to specify an amount of tokens");
    await expect(contract["buyItem(uint256,uint256)"]
    (2, 5)).to.be.revertedWith("The time of sale elapsed");
  });

  it("We should test cancel of ERC1155 trade separately and then revert of buyItem  when token not on sale",
    async function () {
    await expect(myMarket.connect(accounts[2])["cancel(uint256)"]
    (2)).to.be.revertedWith("Only owner can cancel sale");
    await myMarket.connect(accounts[1])["cancel(uint256)"](2);
    await expect(myMarket.connect(accounts[1])["cancel(uint256)"]
    (2)).to.be.revertedWith("The token is already not on sale");
    await expect(myMarket.connect(accounts[1])["buyItem(uint256,uint256)"]
    (2, 5)).to.be.revertedWith("The token is not on sale");
  });

  it("Test buying 1155 token by user2 (user1 re-list token) and revert when too many tokens is demonded",
    async function () {
    my721Contract.connect(accounts[1]).approve(myMarket.address, 2);
    await expect(myMarket.connect(accounts[1])["listItem(uint256,uint256,uint256)"]
    (2, 100, ethers.BigNumber.from('2000')))
    .to.emit(myMarket, "ListedOnSale")
    .withArgs(5, 2, ethers.BigNumber.from('2000'), 100);
    const contract = myMarket.connect(accounts[2]);
    const trade = await contract.onTrade(5);
    const price = trade["price"];
    const tokenId = trade["tokenId"];
    await expect(myMarket.connect(accounts[1])["buyItem(uint256,uint256)"]
    (5, 150)).to.be.revertedWith("Not enougth is tokens available now");
    await stContract.connect(accounts[2]).approve(myMarket.address, price * 50);
    await expect(contract["buyItem(uint256,uint256)"](5, 50))
    .to.emit(contract, "Sold")
    .withArgs(tokenId, 50, await accounts[2].getAddress);
    await stContract.connect(accounts[2]).approve(myMarket.address, price * 50);
    await expect(contract["buyItem(uint256,uint256)"](5, 50))
    .to.emit(contract, "Sold")
    .withArgs(tokenId, 50, await accounts[2].getAddress);
  });


  it("Test reverts of list on auction 721 token", async function () {
    await expect(myMarket.connect(accounts[2])["listItemOnAuction(uint256,uint256)"]
    (404, ethers.BigNumber.from('2000')))
    .to.be.revertedWith("Invalid token ID");
    await expect(myMarket.connect(accounts[2])["listItemOnAuction(uint256,uint256)"]
    (2, ethers.BigNumber.from('2000')))
    .to.be.revertedWith("To list this token you have to specify an amount of tokens");
  });

  it("Test list on auction 721 token by user1", async function () {
    await expect(myMarket.connect(accounts[1])["createItem(string)"]("URI"))
    .to.emit(myMarket, "Created")
    .withArgs(await accounts[1].getAddress(), 3, 1);

    my721Contract.connect(accounts[1]).approve(myMarket.address, 3);
    await expect(myMarket.connect(accounts[1])["listItemOnAuction(uint256,uint256)"]
    (3, ethers.BigNumber.from('2000')))
    .to.emit(myMarket, "ListedOnAuction")
    .withArgs(6, 3, ethers.BigNumber.from('2000'), 1);
  });

  it("Test reverts of list on auction 1155 token", async function () {
    await expect(myMarket.connect(accounts[2])["listItemOnAuction(uint256,uint256,uint256)"]
    (404, 50, ethers.BigNumber.from('2000')))
    .to.be.revertedWith("Invalid token ID");
    await expect(myMarket.connect(accounts[2])["listItemOnAuction(uint256,uint256,uint256)"]
    (1, 50, ethers.BigNumber.from('2000')))
    .to.be.revertedWith("To list this token you have not to specify an amount of tokens");
  });

  it("Test list on auction 1155 token by user1", async function () {
    await expect(myMarket.connect(accounts[1])["createItem(string,uint256)"]("URI", 100))
    .to.emit(myMarket, "Created")
    .withArgs(await accounts[1].getAddress(), 4, 100);

    my721Contract.connect(accounts[1]).approve(myMarket.address, 4);
    await expect(myMarket.connect(accounts[1])["listItemOnAuction(uint256,uint256,uint256)"]
    (4, 50, ethers.BigNumber.from('2000')))
    .to.emit(myMarket, "ListedOnAuction")
    .withArgs(7, 4, ethers.BigNumber.from('2000'), 50);
  });

  it("Test reverts of makeBid", async function () {
    await expect(myMarket.connect(accounts[2])["makeBid(uint256,uint256)"](3, 2001))
      .to.be.revertedWith("This token/tokens is not on auction");
    await expect(myMarket.connect(accounts[2])["makeBid(uint256,uint256)"](6, 2001))
      .to.be.revertedWith("A bid should be greater or equal than minPrice plus bid step");
    await ethers.provider.send('evm_increaseTime', [10 * 60]);
    await ethers.provider.send('evm_mine', []);
    await expect(myMarket.connect(accounts[2])["makeBid(uint256,uint256)"](6, 2101))
      .to.be.revertedWith("The time of auction elapsed");
  });

  it("Test revert of finishAuction ", async function () {
    await expect(myMarket.connect(accounts[2])["finishAuction(uint256)"](5))
      .to.be.revertedWith("The token/tokens is already not on auction");
  });

  it("Test finishAuction of a failed auctions by user2", async function () {
    await myMarket.connect(accounts[2])["finishAuction(uint256)"](6);

    await myMarket.connect(accounts[2])["finishAuction(uint256)"](7);
  });

  it("Re-list tokens on auctions", async function () {
    my721Contract.connect(accounts[1]).approve(myMarket.address, 3);
    await expect(myMarket.connect(accounts[1])["listItemOnAuction(uint256,uint256)"]
    (3, ethers.BigNumber.from('2000')))
    .to.emit(myMarket, "ListedOnAuction")
    .withArgs(8, 3, ethers.BigNumber.from('2000'), 1);

    my721Contract.connect(accounts[1]).approve(myMarket.address, 4);
    await expect(myMarket.connect(accounts[1])["listItemOnAuction(uint256,uint256,uint256)"]
    (4, 50, ethers.BigNumber.from('2000')))
    .to.emit(myMarket, "ListedOnAuction")
    .withArgs(9, 4, ethers.BigNumber.from('2000'), 50);
  });

  it("Test reverts of finishAuction", async function () {
    await expect(myMarket.connect(accounts[2])["finishAuction(uint256)"](8))
      .to.be.revertedWith("The time of auction is not elapsed yet");
  });

  it("Test makeBid", async function () {
    await stContract.connect(accounts[2]).approve(myMarket.address, ethers.BigNumber.from('2100'));
    await expect(myMarket.connect(accounts[2])["makeBid(uint256,uint256)"]
    (8, ethers.BigNumber.from('2100')))
    .to.emit(myMarket, "bidMade")
    .withArgs(8, 3, ethers.BigNumber.from('2100'), await accounts[2].getAddress());

    await stContract.connect(accounts[3]).approve(myMarket.address, ethers.BigNumber.from('2200'));
    await expect(myMarket.connect(accounts[3])["makeBid(uint256,uint256)"]
    (8, ethers.BigNumber.from('2200')))
    .to.emit(myMarket, "bidMade")
    .withArgs(8, 3, ethers.BigNumber.from('2200'), await accounts[3].getAddress());

    await stContract.connect(accounts[3]).approve(myMarket.address, ethers.BigNumber.from('2100'));
    await expect(myMarket.connect(accounts[3])["makeBid(uint256,uint256)"]
    (9, ethers.BigNumber.from('2100')))
    .to.emit(myMarket, "bidMade")
    .withArgs(9, 4, ethers.BigNumber.from('2100'), await accounts[3].getAddress());

    await stContract.connect(accounts[2]).approve(myMarket.address, ethers.BigNumber.from('2200'));
    await expect(myMarket.connect(accounts[2])["makeBid(uint256,uint256)"]
    (9, ethers.BigNumber.from('2200')))
    .to.emit(myMarket, "bidMade")
    .withArgs(9, 4, ethers.BigNumber.from('2200'), await accounts[2].getAddress());
  });

  it("Test finishAuction", async function () {
    await ethers.provider.send('evm_increaseTime', [10 * 60]);
    await ethers.provider.send('evm_mine', []);
    await expect(myMarket.connect(accounts[2])["finishAuction(uint256)"](8))
    .to.emit(myMarket, "Sold").withArgs(3, 1, await accounts[3].getAddress());
    await expect(myMarket.connect(accounts[0])["finishAuction(uint256)"](9))
    .to.emit(myMarket, "Sold").withArgs(4, 50, await accounts[2].getAddress());
  });

  it("Test finishAuction when only one bidder and time elapsed", async function () {
    my721Contract.connect(accounts[3]).approve(myMarket.address, 3);
    await expect(myMarket.connect(accounts[3])["listItemOnAuction(uint256,uint256)"]
    (3, ethers.BigNumber.from('2000')))
    .to.emit(myMarket, "ListedOnAuction")
    .withArgs(10, 3, ethers.BigNumber.from('2000'), 1);

    await stContract.connect(accounts[2]).approve(myMarket.address, ethers.BigNumber.from('2100'));
    await expect(myMarket.connect(accounts[2])["makeBid(uint256,uint256)"]
    (10, ethers.BigNumber.from('2100')))
    .to.emit(myMarket, "bidMade")
    .withArgs(10, 3, ethers.BigNumber.from('2100'), await accounts[2].getAddress());

    await ethers.provider.send('evm_increaseTime', [10 * 60]);
    await ethers.provider.send('evm_mine', []);

    await myMarket.connect(accounts[3])["finishAuction(uint256)"](10);
  });




});
