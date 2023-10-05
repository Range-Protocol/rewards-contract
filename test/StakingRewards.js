const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const {ethers} = require("hardhat");

const bigInt = value => ethers.getBigInt(value)

describe("Staking Rewards", () => {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingRewardsSetup() {
    const [owner, user] = await ethers.getSigners()
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const lpToken = await MockERC20.deploy("Mock LP Token", "MLPT");
    const rewardToken = await MockERC20.deploy("Mock Reward Token", "MRT");
  
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    const stakingRewards = await StakingRewards.deploy(
      owner.address,
      owner.address,
      await rewardToken.getAddress(),
      await lpToken.getAddress()
    );
    const stakingRewardsAddress = await stakingRewards.getAddress();
    
    return {
      lpToken,
      rewardToken,
      stakingRewards,
      owner,
      user,
      stakingRewardsAddress
    }
  }
  
  describe("Stake", () => {
    it("should not stake with 0 amount", async () => {
      const {
        stakingRewards,
        user,
      } = await loadFixture(deployStakingRewardsSetup);
      
      await expect(stakingRewards.connect(user).stake(0))
        .to.be.revertedWith("Cannot stake 0");
    });
  
    it("should not stake with not enough lp tokens", async () => {
      const {
        lpToken,
        stakingRewards,
        stakingRewardsAddress,
        user,
      } = await loadFixture(deployStakingRewardsSetup);
      
      await lpToken.connect(user).mint();
      const userLPBalance = await lpToken.balanceOf(user.address);
      await lpToken.connect(user).approve(stakingRewardsAddress, userLPBalance);
      
      await expect(stakingRewards.connect(user).stake(userLPBalance * bigInt(2)))
        .to.be.revertedWith("SafeERC20: low-level call failed")
    });
  
    it("Should Stake LP tokens by user", async function () {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
    
      await lpToken.connect(user).mint();
      expect(await stakingRewards.balanceOf(user.address)).to.be.equal(0);
      expect(await stakingRewards.totalSupply()).to.be.equal(0);
    
      const userLPBalance = await lpToken.balanceOf(user.address);
      await lpToken.connect(user).approve(stakingRewardsAddress, userLPBalance);
      await expect( stakingRewards.connect(user).stake(userLPBalance)).to.be.emit(
        stakingRewards,
        "Staked"
      ).withArgs(user.address, userLPBalance);
      expect(await stakingRewards.balanceOf(user.address)).to.be.equal(userLPBalance);
      expect(await stakingRewards.totalSupply()).to.be.equal(userLPBalance);
      expect(await stakingRewards.rewardPerToken()).to.be.equal(0);
    });
  });
  
  describe("Add Rewards", () => {
    it("should not add rewards by non owner", async () => {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
    
      await expect(stakingRewards.connect(user).notifyRewardAmount(ethers.parseEther("1")))
        .to.be.revertedWith("Caller is not RewardsDistribution contract");
    });
    
    it("should not add more rewards than added balance", async () => {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
      
      await expect(stakingRewards.connect(owner).notifyRewardAmount(ethers.parseEther("1")))
        .to.be.revertedWith("Provided reward too high");
    });
    
    it("Should add rewards by owner", async function () {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
    
      await rewardToken.connect(owner).mint();
      expect(await stakingRewards.lastUpdateTime()).to.be.equal(0);
      expect(await stakingRewards.periodFinish()).to.be.equal(0);
      expect(await stakingRewards.rewardRate()).to.be.equal(0);
      expect(await rewardToken.balanceOf(stakingRewardsAddress)).to.be.equal(0);
    
      const rewardAmountToAdd = await rewardToken.balanceOf(owner.address);
      await rewardToken.connect(owner).transfer(stakingRewardsAddress, rewardAmountToAdd);
      await expect(stakingRewards.connect(owner).notifyRewardAmount(rewardAmountToAdd))
        .to.emit(stakingRewards, "RewardAdded")
        .withArgs(rewardAmountToAdd);
    
      expect(await stakingRewards.lastUpdateTime()).to.not.be.equal(0);
      expect(await stakingRewards.periodFinish()).to.not.be.equal(0);
      expect(await stakingRewards.rewardRate())
        .to.be.equal(rewardAmountToAdd / await stakingRewards.rewardsDuration());
      expect(await rewardToken.balanceOf(stakingRewardsAddress)).to.be.equal(rewardAmountToAdd);
    });
  });
  
  describe("Rewards Duration", () => {
    it("Should not set rewards duration by non-owner", async () => {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
      await expect(stakingRewards.connect(user).setRewardsDuration(1))
        .to.be.revertedWith("Only the contract owner may perform this action");
    });
  
    it("Should not set rewards duration when the current period has not elapsed", async () => {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
      
      await rewardToken.connect(owner).mint();
      const rewardTokenBalance = await rewardToken.balanceOf(owner.address);
      await rewardToken.connect(owner).transfer(stakingRewardsAddress, rewardTokenBalance);
      await stakingRewards.connect(owner).notifyRewardAmount(rewardTokenBalance);
  
      await expect(stakingRewards.connect(owner).setRewardsDuration(1))
        .to.be.revertedWith(
          "Previous rewards period must be complete before changing the duration for the new period"
        );
    });
    
    it("Set new rewards duration", async () => {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
      
      const SECONDS_IN_SEVEN_DAYS = 604800;
      expect(await stakingRewards.rewardsDuration()).to.be.equal(SECONDS_IN_SEVEN_DAYS);
      
      await expect(stakingRewards.connect(owner).setRewardsDuration(SECONDS_IN_SEVEN_DAYS * 2))
        .to.emit(stakingRewards, "RewardsDurationUpdated")
        .withArgs(SECONDS_IN_SEVEN_DAYS * 2);
    });
  });
  
  describe("Withdraw", () => {
    it("claim reward by user", async () => {
      const {
        lpToken,
        rewardToken,
        stakingRewards,
        owner,
        user,
        stakingRewardsAddress
      } = await loadFixture(deployStakingRewardsSetup);
      
      await lpToken.connect(user).mint();
      await rewardToken.connect(owner).mint();
      
      const lpAmount = await lpToken.balanceOf(user.address);
      await lpToken.connect(user).approve(stakingRewardsAddress, lpAmount);
      await stakingRewards.connect(user).stake(lpAmount);
      
      const rewardAmount = await rewardToken.balanceOf(owner.address);
      await rewardToken.connect(owner).transfer(stakingRewardsAddress, rewardAmount);
      await stakingRewards.notifyRewardAmount(rewardAmount);

      const SECONDS_IN_WEEK = 604800;
      const expectedRewardAmount = rewardAmount * bigInt(9999) / bigInt(10000);
      expect(await stakingRewards.earned(user.address)).to.be.equal(0);
      
      await ethers.provider.send("evm_increaseTime", [SECONDS_IN_WEEK / 2]);
      await ethers.provider.send("evm_mine");
      expect(await stakingRewards.earned(user.address))
        .to.be.gte(expectedRewardAmount / bigInt(2));
  
      await ethers.provider.send("evm_increaseTime", [SECONDS_IN_WEEK / 2]);
      await ethers.provider.send("evm_mine");
      expect(await stakingRewards.earned(user.address))
        .to.be.gte(expectedRewardAmount / bigInt(2));
      
      
      expect(await lpToken.balanceOf(user.address)).to.be.equal(0);
      expect(await rewardToken.balanceOf(user.address)).to.be.equal(0);
      expect(await lpToken.balanceOf(stakingRewardsAddress)).to.be.equal(lpAmount);
      expect(await rewardToken.balanceOf(stakingRewardsAddress)).to.be.equal(rewardAmount);
      
      await stakingRewards.connect(user).getReward();
  
      expect(await lpToken.balanceOf(user.address)).to.be.equal(0);
      expect(await rewardToken.balanceOf(user.address)).to.be.gte(expectedRewardAmount);
      expect(await lpToken.balanceOf(stakingRewardsAddress)).to.be.equal(lpAmount);
      expect(await rewardToken.balanceOf(stakingRewardsAddress))
        .to.be.lt(bigInt(rewardAmount) - expectedRewardAmount);
      
      await stakingRewards.connect(user).exit();
      expect(await lpToken.balanceOf(user.address)).to.be.equal(lpAmount);
      expect(await rewardToken.balanceOf(user.address)).to.be.gte(expectedRewardAmount);
      expect(await lpToken.balanceOf(stakingRewardsAddress)).to.be.equal(0);
      expect(await rewardToken.balanceOf(stakingRewardsAddress))
        .to.be.lt(bigInt(rewardAmount) - expectedRewardAmount);
    });
  })
});
