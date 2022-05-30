import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("listsale", "List item on sale")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("tokenid", "tokenID")
  .addParam("amount", "amount")
  .addParam("price", "price")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyMarket",
  process.env.CONTRACT_ACCAUNT!, accounts[args.user]);

  if (args.amount == 0){
    const my721Contract = await hre.ethers.getContractAt("My721Contract",
                              process.env.ERC721_CONTRACT!,
                              accounts[args.user]);
    await my721Contract.approve(process.env.CONTRACT_ACCAUNT!, args.tokenid);

    const tx = await contract["listItem(uint256,uint256)"](args.tokenid, args.price);
    const txx = await tx.wait();
    console.log(
      {
        tradeid: txx.events[2].args["tradeid"].toNumber(),
        tokenid: txx.events[2].args["tokenid"].toNumber()
      }
    );
  }
  else {
    const my1155Contract = await hre.ethers.getContractAt("My1155Contract",
                              process.env.ERC1155_CONTRACT!,
                              accounts[args.user]);
    await my1155Contract.approve(process.env.CONTRACT_ACCAUNT!, args.tokenid);

    const tx = await contract["listItem(uint256,uint256,uint256)"](args.tokenid, args.amount, args.price);
    const txx = await tx.wait();
    console.log(
      {
        tradeid: txx.events[2].args["tradeid"].toNumber(),
        tokenid: txx.events[2].args["tokenid"].toNumber()
      }
    );
  }
});
