const express = require("express");
const { getBlockchainConfig } = require("../controllers/configController");

const router = express.Router();

router.get("/blockchain", getBlockchainConfig);

module.exports = router;

