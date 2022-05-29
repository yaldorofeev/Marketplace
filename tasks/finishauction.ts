import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("finishauction", "Finish auction")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("tradeid", "tradeID")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyMarket",
  process.env.CONTRACT_ACCAUNT!, accounts[args.user]);

  const tx = await contract.finishAuction(args.tradeid);
  tx.wait();
  console.log(tx);


});
