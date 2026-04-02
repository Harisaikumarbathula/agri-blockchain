const fs = require("fs");
const path = require("path");
const Web3 = require("web3");

const artifactPath = path.resolve(
  __dirname,
  "../../../blockchain/build/contracts/FarmSupplyChain.json"
);
const defaultSignerPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

let web3Instance;
let signerAccount;

function getWeb3() {
  if (!web3Instance) {
    const providerUrl = process.env.GANACHE_URL || "http://127.0.0.1:7545";
    web3Instance = new Web3(new Web3.providers.HttpProvider(providerUrl));
  }

  return web3Instance;
}

function getContractArtifact() {
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Smart contract artifact not found. Run `npm install`, `npm run compile`, and `npm run migrate` inside the blockchain directory first."
    );
  }

  return JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
}

function getDeployedNetwork() {
  const artifact = getContractArtifact();
  const configuredNetworkId = process.env.CONTRACT_NETWORK_ID;
  const networkId = configuredNetworkId || Object.keys(artifact.networks || {})[0];

  if (!networkId || !artifact.networks?.[networkId]) {
    throw new Error(
      "Contract is not deployed to Ganache. Run `npm run migrate` inside the blockchain directory."
    );
  }

  return {
    networkId,
    address: artifact.networks[networkId].address,
  };
}

function getSignerAccount() {
  if (!signerAccount) {
    const web3 = getWeb3();
    const privateKey = process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY || defaultSignerPrivateKey;

    signerAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

    if (!web3.eth.accounts.wallet[signerAccount.address]) {
      web3.eth.accounts.wallet.add(signerAccount);
    }

    web3.eth.defaultAccount = signerAccount.address;
  }

  return signerAccount;
}

function getContract() {
  const web3 = getWeb3();
  const artifact = getContractArtifact();
  const deployedNetwork = getDeployedNetwork();

  return new web3.eth.Contract(artifact.abi, deployedNetwork.address);
}

function getBlockchainMetadata() {
  const artifact = getContractArtifact();
  const deployedNetwork = getDeployedNetwork();
  const signer = getSignerAccount();

  return {
    abi: artifact.abi,
    address: deployedNetwork.address,
    networkId: deployedNetwork.networkId,
    rpcUrl: process.env.GANACHE_URL || "http://127.0.0.1:7545",
    chainId: Number(process.env.CHAIN_ID || 1337),
    signerAddress: signer.address,
  };
}

module.exports = {
  getWeb3,
  getSignerAccount,
  getContract,
  getBlockchainMetadata,
};
