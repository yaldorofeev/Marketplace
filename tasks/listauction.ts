import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("listauction", "List item on auction")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("tokenid", "tokenID")
  .addParam("amount", "amount")
  .addParam("minprice", "start price")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyMarket",
  process.env.CONTRACT_ACCAUNT!, accounts[args.user]);

  if (args.amount == 0){
    const tx = await contract["listItemOnAuction(uint256,uint256)"]
    (args.tokenid, args.minprice);
    tx.wait();
    console.log(tx);
  }
  else {
    const tx = await contract["listItemOnAuction(uint256,uint256,uint256)"]
    (args.tokenid, args.amount, args.minprice);
    tx.wait();
    console.log(tx);
  }
});
