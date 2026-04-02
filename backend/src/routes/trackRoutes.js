const express = require("express");
const { getPublicTrackOrder } = require("../controllers/orderController");

const router = express.Router();

router.get("/:orderNumber", getPublicTrackOrder);

module.exports = router;
