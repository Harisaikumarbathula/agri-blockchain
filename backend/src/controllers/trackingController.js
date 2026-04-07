const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const { updateOrderStatus: updateOrderStatusOnChain } = require("../services/blockchainService");

// @desc    Update delivery status to out_for_delivery
// @route   PUT /api/track/status/:id
// @access  Admin/Farmer
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  // Allow transitions specifically for out_for_delivery for demo tracking
  if (!["shipped", "out_for_delivery", "delivered"].includes(status)) {
    res.status(400);
    throw new Error("Invalid delivery status transition.");
  }

  // Record on blockchain
  const blockchainResult = await updateOrderStatusOnChain(order.blockchainOrderId, status);
  if (!order.blockchainRefs.statusUpdated) {
    order.blockchainRefs.statusUpdated = {};
  }
  order.blockchainRefs.statusUpdated[status] = blockchainResult.receipt.transactionHash;

  order.status = status;
  order.statusHistory.push({ status, changedAt: new Date() });
  
  if (status === "out_for_delivery" && !order.location) {
    order.location = { lat: 21.1458, lng: 79.0882 }; // initial point
  }

  await order.save();

  res.json({
    message: `Order status updated to ${status}`,
    order
  });
});

// @desc    Get tracking details including location
// @route   GET /api/track/details/:id
// @access  Public / Buyer
const getOrderTrackingDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
     .populate("productId", "name category imageUrl");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  res.json({ 
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    location: order.location,
    statusHistory: order.statusHistory,
    product: order.productId 
  });
});

// @desc    Get analytics for dashboard
// @route   GET /api/track/analytics
// @access  Admin
const getDeliveryAnalytics = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const deliveredOrders = await Order.countDocuments({ status: "delivered" });
  const pendingOrders = await Order.countDocuments({ status: "pending" });
  const outForDelivery = await Order.countDocuments({ status: "out_for_delivery" });

  res.json({
    totalOrders,
    deliveredOrders,
    pendingOrders,
    outForDelivery
  });
});

module.exports = {
  updateDeliveryStatus,
  getOrderTrackingDetails,
  getDeliveryAnalytics
};
