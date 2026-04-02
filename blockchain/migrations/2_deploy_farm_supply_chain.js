const FarmSupplyChain = artifacts.require("FarmSupplyChain");

module.exports = async function (deployer) {
  await deployer.deploy(FarmSupplyChain);
};
