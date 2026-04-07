const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const generateOrderNumber = require("../utils/generateOrderNumber");
const generatePaymentReference = require("../utils/generatePaymentReference");
const {
  recordOrder,
  recordPayment,
  updateOrderStatus: updateOrderStatusOnChain,
  cancelOrder: cancelOrderOnChain,
  recordCodCollected,
} = require("../services/blockchainService");

function appendStatusHistory(order, status) {
  order.statusHistory.push({ status, changedAt: new Date() });
}

function appendPaymentHistory(order, status, reference, txHash) {
  order.paymentHistory.push({
    status,
    reference,
    txHash,
    changedAt: new Date(),
  });
}

function canCancelOrder(order) {
  if (order.status !== "pending") {
    return false;
  }

  if (order.paymentMethod === "cod") {
    return true;
  }

  return ["pending", "failed"].includes(order.paymentStatus);
}

function toPublicOrder(doc) {
  const order = doc.toObject ? doc.toObject() : doc;
  
  // Extra safety check for populated names
  const farmerName = order.farmerId?.name || (doc.farmerId && doc.farmerId.name) || "Verified Farmer";
  const buyerName = order.buyerId?.name || (doc.buyerId && doc.buyerId.name) || "Verified Buyer";

  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    quantity: order.quantity,
    totalPaise: order.totalPaise,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    blockchainRefs: order.blockchainRefs,
    statusHistory: order.statusHistory,
    paymentHistory: order.paymentHistory,
    location: order.location,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    farmer: {
      name: farmerName,
    },
    buyer: {
      name: buyerName,
    },
    product: {
      name: order.productId?.name,
      category: order.productId?.category,
      unit: order.productId?.unit,
      batchCode: order.productId?.batchCode,
      originLocation: order.productId?.originLocation,
      harvestDate: order.productId?.harvestDate,
      imageUrl: order.productId?.imageUrl,
    },
  };
}

const getOrders = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "buyer") {
    filter.buyerId = req.user._id;
  } else if (req.user.role === "farmer") {
    filter.farmerId = req.user._id;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter)
    .populate("buyerId", "name email")
    .populate("farmerId", "name email")
    .populate("productId")
    .sort({ createdAt: -1 });

  return res.json({ orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("buyerId", "name email")
    .populate("farmerId", "name email")
    .populate("productId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  const isOwner =
    order.buyerId._id.toString() === req.user._id.toString() ||
    order.farmerId._id.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You are not allowed to view this order.");
  }

  return res.json({ order });
});

const createOrder = asyncHandler(async (req, res) => {
  const { productId, quantity, paymentMethod } = req.body;

  if (!productId || !quantity || !paymentMethod) {
    res.status(400);
    throw new Error("Product, quantity, and payment method are required.");
  }

  const numericQuantity = Number(quantity);
  if (Number.isNaN(numericQuantity) || numericQuantity <= 0) {
    res.status(400);
    throw new Error("Quantity must be a valid positive number.");
  }

  if (!["upi", "cod"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("Payment method must be UPI or COD.");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isAvailable) {
    res.status(404);
    throw new Error("Product is not available.");
  }

  if (numericQuantity > Number(product.quantity)) {
    res.status(400);
    throw new Error("Requested quantity exceeds the available stock.");
  }

  const orderNumber = await generateOrderNumber(Order);
  const totalPaise = Number(product.pricePaise) * numericQuantity;
  const paymentReference =
    paymentMethod === "upi" ? generatePaymentReference(orderNumber, "UPI") : "";

  let blockchainResult;
  try {
    blockchainResult = await recordOrder({
      orderNumber,
      productBlockchainId: product.blockchainProductId,
      quantity: Number(quantity),
      totalPaise,
      paymentMethod,
      paymentStatus: "pending",
    });
  } catch (error) {
    if (error.message.includes("Product not found") || error.message.includes("revert")) {
      res.status(500);
      throw new Error("Blockchain sync error: Product not found on the blockchain. Please try again later while the system resyncs.");
    }
    throw error;
  }

  product.quantity = Number(product.quantity) - Number(quantity);
  product.isAvailable = product.quantity > 0 && product.isAvailable;
  product.lastBlockchainTxHash = blockchainResult.receipt.transactionHash;
  await product.save();

  const order = await Order.create({
    orderNumber,
    buyerId: req.user._id,
    farmerId: product.farmerId,
    productId: product._id,
    blockchainProductId: product.blockchainProductId,
    quantity: Number(quantity),
    totalPaise,
    platformFeePaise: Math.floor(totalPaise * 0.2),
    status: "pending",
    paymentMethod,
    paymentStatus: "pending",
    paymentReference,
    blockchainOrderId: blockchainResult.blockchainOrderId,
    blockchainRefs: {
      orderCreated: blockchainResult.receipt.transactionHash,
    },
    statusHistory: [{ status: "pending", changedAt: new Date() }],
  });

  const populatedOrder = await Order.findById(order._id)
    .populate("buyerId", "name email")
    .populate("farmerId", "name email")
    .populate("productId");

  return res.status(201).json({
    order: populatedOrder,
    paymentIntent:
      paymentMethod === "upi"
        ? {
            reference: paymentReference,
            amountPaise: totalPaise,
            method: "upi",
          }
        : null,
    message:
      paymentMethod === "upi"
        ? "Order created. Simulate the UPI payment to continue."
        : "COD order created successfully.",
  });
});

const simulatePayment = asyncHandler(async (req, res) => {
  const { outcome } = req.body;
  const order = await Order.findById(req.params.id)
    .populate("buyerId", "name email")
    .populate("farmerId", "name email")
    .populate("productId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (order.buyerId._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the buyer can simulate payment for this order.");
  }

  if (order.paymentMethod !== "upi") {
    res.status(400);
    throw new Error("Only UPI orders can use simulated payments.");
  }

  if (order.status !== "pending") {
    res.status(400);
    throw new Error("Payment can only be simulated before the farmer confirms the order.");
  }

  if (!["paid", "failed"].includes(outcome)) {
    res.status(400);
    throw new Error("Payment outcome must be paid or failed.");
  }

  if (order.paymentStatus === "paid") {
    res.status(400);
    throw new Error("This UPI order is already marked as paid.");
  }

  const attempt = order.paymentHistory.length + 1;
  const paymentReference =
    order.paymentStatus === "failed"
      ? generatePaymentReference(order.orderNumber, "UPI", attempt)
      : order.paymentReference || generatePaymentReference(order.orderNumber, "UPI", attempt);

  const blockchainResult = await recordPayment(order.blockchainOrderId, outcome, paymentReference);

  order.paymentStatus = outcome;
  order.paymentReference = paymentReference;
  order.blockchainRefs.paymentRecorded = blockchainResult.receipt.transactionHash;
  appendPaymentHistory(order, outcome, paymentReference, blockchainResult.receipt.transactionHash);
  await order.save();

  return res.json({
    order,
    message: outcome === "paid" ? "UPI payment simulated successfully." : "UPI payment marked as failed.",
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id)
    .populate("buyerId", "name email")
    .populate("farmerId", "name email")
    .populate("productId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (!status || !["confirmed", "shipped", "out_for_delivery", "delivered"].includes(status)) {
    res.status(400);
    throw new Error("A valid order status is required.");
  }

  if (status === "confirmed") {
    const isFarmer = req.user.role === "farmer" && order.farmerId._id.toString() === req.user._id.toString();
    if (!isFarmer) {
      res.status(403);
      throw new Error("Only the farmer can confirm this order.");
    }

    if (order.status !== "pending") {
      res.status(400);
      throw new Error("Only pending orders can be confirmed.");
    }

    if (order.paymentMethod === "upi" && order.paymentStatus !== "paid") {
      res.status(400);
      throw new Error("UPI orders must be paid before the farmer can confirm them.");
    }
  } else if (status === "shipped") {
    const isFarmer = req.user.role === "farmer" && order.farmerId._id.toString() === req.user._id.toString();
    if (!isFarmer) {
      res.status(403);
      throw new Error("Only the farmer can mark this order as shipped.");
    }

    if (order.status !== "confirmed") {
      res.status(400);
      throw new Error("Only confirmed orders can be shipped.");
    }
  } else if (status === "out_for_delivery") {
    const isFarmer = req.user.role === "farmer" && order.farmerId._id.toString() === req.user._id.toString();
    if (!isFarmer) {
      res.status(403);
      throw new Error("Only the farmer can mark this order as out for delivery.");
    }

    if (order.status !== "shipped") {
      res.status(400);
      throw new Error("Only shipped orders can be marked as out for delivery.");
    }
  }

  if (status === "delivered") {
    const isBuyer = req.user.role === "buyer" && order.buyerId._id.toString() === req.user._id.toString();

    if (!isBuyer) {
      res.status(403);
      throw new Error("Only the buyer can confirm delivery.");
    }

    if (!["shipped", "out_for_delivery"].includes(order.status)) {
      res.status(400);
      throw new Error("Only shipped or out for delivery orders can be marked as delivered.");
    }
  }

  const blockchainResult = await updateOrderStatusOnChain(order.blockchainOrderId, status);
  order.blockchainRefs.statusUpdated[status] = blockchainResult.receipt.transactionHash;

  order.status = status;
  appendStatusHistory(order, status);

  if (status === "delivered" && order.paymentMethod === "cod") {
    const paymentReference = generatePaymentReference(order.orderNumber, "COD");
    const codResult = await recordCodCollected(order.blockchainOrderId, paymentReference);

    order.paymentStatus = "collected";
    order.paymentReference = paymentReference;
    order.blockchainRefs.codCollected = codResult.receipt.transactionHash;
    appendPaymentHistory(order, "collected", paymentReference, codResult.receipt.transactionHash);
  }

  await order.save();

  return res.json({
    order,
    message:
      status === "delivered" && order.paymentMethod === "cod"
        ? "Delivery confirmed and COD payment collected."
        : `Order updated to ${status}.`,
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("productId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (req.user.role !== "buyer" || order.buyerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the buyer can cancel this order.");
  }

  if (!canCancelOrder(order)) {
    res.status(400);
    throw new Error("This order can no longer be cancelled.");
  }

  const blockchainResult = await cancelOrderOnChain(order.blockchainOrderId);

  const product = await Product.findById(order.productId._id);
  product.quantity += order.quantity;
  product.isAvailable = true;
  product.lastBlockchainTxHash = blockchainResult.receipt.transactionHash;
  await product.save();

  order.status = "cancelled";
  order.blockchainRefs.cancelled = blockchainResult.receipt.transactionHash;
  appendStatusHistory(order, "cancelled");
  await order.save();

  return res.json({
    order,
    message: "Order cancelled successfully.",
  });
});

const getPublicTrackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .populate("productId")
    .populate({ path: "farmerId", select: "name" })
    .populate({ path: "buyerId", select: "name" });

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  return res.json({ order: toPublicOrder(order) });
});

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  simulatePayment,
  updateOrderStatus,
  cancelOrder,
  getPublicTrackOrder,
};
