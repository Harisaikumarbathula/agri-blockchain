const express = require("express");
const {
  getProducts,
  getFarmerProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getProducts);
router.get("/my/listings", protect, authorize("farmer"), getFarmerProducts);
router.get("/:id", getProductById);
router.post("/", protect, authorize("farmer"), createProduct);
router.put("/:id", protect, authorize("farmer", "admin"), updateProduct);
router.delete("/:id", protect, authorize("farmer", "admin"), deleteProduct);

module.exports = router;

