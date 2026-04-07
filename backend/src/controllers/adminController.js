const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.json({ users });
});

const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, monetizedOrders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ isDeleted: false }),
    Order.countDocuments(),
    Order.find({
      status: { $ne: "cancelled" },
      paymentStatus: { $in: ["paid", "collected"] },
    }).select("platformFeePaise"),
  ]);

  const revenuePaise = monetizedOrders.reduce((sum, order) => sum + order.platformFeePaise, 0);

  return res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    revenuePaise,
  });
});

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isDeleted: false })
    .populate("farmerId", "name email")
    .sort({ createdAt: -1 });

  return res.json({ products });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("buyerId", "name email")
    .populate("farmerId", "name email")
    .populate("productId")
    .sort({ createdAt: -1 });

  return res.json({ orders });
});

module.exports = {
  getUsers,
  getStats,
  getAllProducts,
  getAllOrders,
};
