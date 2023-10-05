// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { LedgerSigner } = require("@anders-t/ethers-ledger");

async function main() {
  const provider = hre.ethers.getDefaultProvider("");
  const ledger = await new LedgerSigner(provider, "");
  
  const owner = ""; // to be updated.
  const stakingToken = ""; // to be updated.
  const rewardToken = ""; // to be updated.
  const rewardDistributor = ""; // to be updated.
  
  const stakingRewards = await hre.ethers.deployContract("StakingRewards", [
    owner,
    rewardDistributor,
    rewardToken,
    stakingToken,
  ]);
  await stakingRewards.waitForDeployment();
  console.log("Staking Rewards: ", await stakingRewards.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
