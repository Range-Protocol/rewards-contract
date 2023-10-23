// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
	const owner = "0x0Aa8EBb6aD5A8e499E550ae2C461197624c6e667"; // to be updated.
	const rewardDistributor = "0x0Aa8EBb6aD5A8e499E550ae2C461197624c6e667"; // to be updated.
	const rewardToken = "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8"; // WMNT https://www.coingecko.com/en/coins/wrapped-mantle
	// Range iZUMi WETH/USDT 0.30% Passive LP (R-UNI) https://explorer.mantle.xyz/address/0xE441d252a5686450543C5FfF85Bb06f7c9B6843e
	const stakingToken = "0xE441d252a5686450543C5FfF85Bb06f7c9B6843e";
	const StakingRewards = await hre.ethers.getContractFactory("StakingRewards");
	
	// address _owner,
	// address _rewardsDistribution,
	// address _rewardsToken,
	// address _stakingToken
	const stakingRewards = await StakingRewards.deploy(
		owner,
		rewardDistributor,
		rewardToken,
		stakingToken
	);
	console.log("Staking Rewards: ", stakingRewards.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
