import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("create", "Create NFT")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("tokenuri", "tokenURI")
  .addParam("amount", "amount")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyMarket",
  process.env.CONTRACT_ACCAUNT!, accounts[args.user]);

  if (args.amount == 1){
    const tx = await contract["createItem(string)"](args.tokenuri);
    const txx = await tx.wait();
    console.log({id: txx.events[2].args["id"].toNumber()});
  }
  else {
    const tx = await contract["createItem(string,uint256)"](args.tokenuri, args.amount);
    const txx = await tx.wait();
    console.log({id: txx.events[2].args["id"].toNumber()});
  }

});
