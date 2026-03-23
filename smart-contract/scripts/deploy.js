const hre = require("hardhat");

async function main() {

  const Voting = await hre.ethers.getContractFactory("BlockVote");

  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  console.log("Contract deployed to:", voting.target);
}

main();











//  0x555Ec32A881b60ac71b214267BAE829EbFE12265