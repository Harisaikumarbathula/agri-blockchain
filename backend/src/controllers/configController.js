const asyncHandler = require("../utils/asyncHandler");
const { getBlockchainMetadata } = require("../services/blockchainService");

const getBlockchainConfig = asyncHandler(async (req, res) => {
  return res.json(getBlockchainMetadata());
});

module.exports = {
  getBlockchainConfig,
};

