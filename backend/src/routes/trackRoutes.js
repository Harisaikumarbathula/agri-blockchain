const express = require("express");
const { getPublicTrackOrder } = require("../controllers/orderController");
const {
  updateDeliveryStatus,
  getOrderTrackingDetails,
  getDeliveryAnalytics
} = require("../controllers/trackingController");

const router = express.Router();

router.get("/analytics", getDeliveryAnalytics);
router.get("/details/:id", getOrderTrackingDetails);
router.put("/status/:id", updateDeliveryStatus);
router.get("/:orderNumber", getPublicTrackOrder);

module.exports = router;
