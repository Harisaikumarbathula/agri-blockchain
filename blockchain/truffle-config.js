require("dotenv").config();

const host = process.env.GANACHE_HOST || "127.0.0.1";
const port = Number(process.env.GANACHE_PORT || 7545);
const networkId = process.env.CONTRACT_NETWORK_ID || "1337";

module.exports = {
  contracts_directory: "./contracts",
  contracts_build_directory: "./build/contracts",
  migrations_directory: "./migrations",
  networks: {
    development: {
      host,
      port,
      network_id: networkId,
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
