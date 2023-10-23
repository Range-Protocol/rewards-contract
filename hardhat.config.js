require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  etherscan: {
    apiKey: "",
  },
  networks: {
    hardhat: {
      forking: { url: "https://1rpc.io/mantle"}
    },
    mainnet: {
      accounts: [],
      chainId: 1,
      url: "",
    },
    polygon: {
      accounts: [],
      chainId: 137,
      url: "",
    },
    optimism: {
      accounts: [],
      chainId: 10,
      url: "",
    },
    arbitrum: {
      accounts: [],
      chainId: 42161,
      url: "",
    },
    goerli: {
      accounts: [],
      chainId: 5,
      url: "",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      }
    ],
  },
};
