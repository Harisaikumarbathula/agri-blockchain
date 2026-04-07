const express = require("express");
const {
  getOrders,
  getOrderById,
  createOrder,
  createPaymentOrder,
  verifyPayment,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getOrders);
router.post("/", authorize("buyer"), createOrder);
router.post("/:id/payment/order", authorize("buyer"), createPaymentOrder);
router.post("/:id/payment/verify", authorize("buyer"), verifyPayment);
router.put("/:id/status", authorize("farmer", "buyer"), updateOrderStatus);
router.delete("/:id", authorize("buyer"), cancelOrder);
router.get("/:id", getOrderById);

module.exports = router;
