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



  const stContract = await hre.ethers.getContractAt("IERC20_MY",
                            process.env.SUPER_TOKEN_CONTRACT!,
                            accounts[args.user]);

  await stContract.approve(process.env.CONTRACT_ACCAUNT!, args.bid);

  const tx = await contract.makeBid(args.tradeid, args.bid);
  tx.wait();
  console.log(tx);


});
