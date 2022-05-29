import { ethers } from "hardhat";
import * as dotenv from "dotenv";

async function main() {
  const saleTime = 10;
  const auctionTime = 10;
  const bidStep = 1000;

  const MyMarket = await ethers.getContractFactory("MyMarket");
  const myMarket = await MyMarket.deploy(saleTime, auctionTime, bidStep,
                                    process.env.ERC721_CONTRACT!,
                                    process.env.ERC1155_CONTRACT!,
                                    process.env.SUPER_TOKEN_CONTRACT!);

  await myMarket.deployed();

  console.log("MyMarket deployed to:", myMarket.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
