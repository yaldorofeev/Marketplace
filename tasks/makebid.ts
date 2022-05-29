import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("makebid", "Make bid on auction")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("tradeid", "tradeID")
  .addParam("bid", "bid")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyMarket",
  process.env.CONTRACT_ACCAUNT!, accounts[args.user]);

  const tx = await contract.makeBid(args.tradeid, args.bid);
  tx.wait();
  console.log(tx);


});
