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
    const tx = await contract["listItem(uint256,uint256)"](args.tokenid, args.price);
    tx.wait();
    console.log(tx);

  }
  else {
    const tx = await contract["listItem(uint256,uint256,uint256)"](args.tokenid, args.amount, args.price);
    tx.wait();
    console.log(tx);
  }
});
