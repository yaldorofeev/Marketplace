import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("buy", "Buy item")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("tradeid", "tradeID")
  .addParam("amount", "amount")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyMarket",
  process.env.CONTRACT_ACCAUNT!, accounts[args.user]);

  if (args.amount == 0) {
    const tx = await contract["buyItem(uint256)"](args.tradeid);
    tx.wait();
    console.log(tx);

  }
  else {
    const tx = await contract["buyItem(uint256,uint256)"](args.tradeid, args.amount);
    tx.wait();
    console.log(tx);
  }
});
