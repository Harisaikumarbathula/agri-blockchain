const express = require("express");
const {
  getUsers,
  getStats,
  getAllProducts,
  getAllOrders,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/users", getUsers);
router.get("/stats", getStats);
router.get("/products", getAllProducts);
router.get("/orders", getAllOrders);

module.exports = router;

