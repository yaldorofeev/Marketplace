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

  const trade = await contract.onTrade(3);
  const price = trade["price"];

  const stContract = await hre.ethers.getContractAt("IERC20_MY",
                            process.env.SUPER_TOKEN_CONTRACT!,
                            accounts[args.user]);

  if (args.amount == 0) {
    const t = await stContract.approve(process.env.CONTRACT_ACCAUNT!, price);
    await t.wait();
    const tx = await contract["buyItem(uint256)"](args.tradeid);
    const txx = await tx.wait();
    console.log(
      {
        tokenid: txx.events[2].args["id"].toNumber(),
        buyer: txx.events[2].args["buyer"]
      }
    );
  }
  else {
    await stContract.approve(process.env.CONTRACT_ACCAUNT!, price * args.amount);
    const tx = await contract["buyItem(uint256,uint256)"](args.tradeid, args.amount);
    const txx = await tx.wait();
    console.log(
      {
        tokenid: txx.events[2].args["id"].toNumber(),
        buyer: txx.events[2].args["buyer"]
      }
    );
  }
});
