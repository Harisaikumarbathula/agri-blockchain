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
  getOrderStatusProofs,
} = require("../services/blockchainService");
const {
  isRazorpayConfigured,
  getRazorpayKeyId,
  createCheckoutOrder,
  verifyCheckoutSignature,
} = require("../services/razorpayService");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeAddress(address = {}, fallback = {}) {
  return {
    place: normalizeString(address.place || address.village || address.district || fallback.place || fallback.village || fallback.district),
    state: normalizeString(address.state || fallback.state),
    country: normalizeString(address.country || fallback.country),
    pincode: normalizeString(address.pincode || fallback.pincode),
  };
}

function normalizeContact(contact = {}, fallback = {}) {
  return {
    name: normalizeString(contact.name || fallback.name),
    email: normalizeEmail(contact.email || fallback.email),
    phoneExtension: normalizeString(contact.phoneExtension || fallback.phoneExtension),
    phone: normalizeString(contact.phone || fallback.phone),
    address: normalizeAddress(contact.address || {}, fallback.address || {}),
  };
}

function getBuyerContactValidationError(contact) {
  if (!contact.email || !contact.phoneExtension || !contact.phone || !contact.address.place || !contact.address.state || !contact.address.country || !contact.address.pincode) {
    return "Delivery address, pincode, mobile number, and email are required to place the order.";
  }

  if (!/^\S+@\S+\.\S+$/.test(contact.email)) {
    return "A valid email address is required to place the order.";
  }

  if (!/^\+?[0-9]{1,4}$/.test(contact.phoneExtension)) {
    return "Mobile extension must be 1 to 4 digits and may start with +.";
  }

  if (!/^[0-9+\-\s()]{8,20}$/.test(contact.phone)) {
    return "A valid mobile number is required to place the order.";
  }

  if (!/^[0-9]{4,10}$/.test(contact.address.pincode)) {
    return "Pincode must be 4 to 10 digits.";
  }

  return "";
}

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

async function getOrderWithRelations(orderId) {
  return Order.findById(orderId)
    .populate("buyerId", "name email phone phoneExtension address")
    .populate("farmerId", "name email phone phoneExtension address")
    .populate("productId");
}

function ensureBuyerOwnsOrder(order, userId, res) {
  if (order.buyerId._id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Only the buyer can manage payment for this order.");
  }
}

function ensureOnlinePaymentOrder(order, res) {
  if (order.paymentMethod !== "upi") {
    res.status(400);
    throw new Error("Only Razorpay-enabled orders can use online checkout.");
  }

  if (order.status !== "pending") {
    res.status(400);
    throw new Error("Payment can only be completed before the farmer confirms the order.");
  }
}

function getBuyerPhoneForCheckout(contact = {}) {
  return `${contact.phoneExtension || ""}${contact.phone || ""}`.replace(/\D/g, "");
}

async function backfillStatusProofs(order) {
  if (!order?.blockchainOrderId || !order?.statusHistory?.length) {
    return order;
  }

  const recordedStatuses = new Set(
    order.statusHistory
      .map((entry) => entry?.status)
      .filter((status) => ["confirmed", "shipped", "out_for_delivery", "delivered"].includes(status))
  );

  if (recordedStatuses.size === 0) {
    return order;
  }

  const currentProofs =
    order.blockchainRefs?.statusUpdated?.toObject?.() ||
    { ...(order.blockchainRefs?.statusUpdated || {}) };
  const missingStatuses = [...recordedStatuses].filter((status) => !currentProofs[status]);

  if (missingStatuses.length === 0) {
    return order;
  }

  try {
    const recoveredProofs = await getOrderStatusProofs(order.blockchainOrderId);
    let changed = false;

    for (const status of missingStatuses) {
      if (recoveredProofs[status]) {
        currentProofs[status] = recoveredProofs[status];
        changed = true;
      }
    }

    if (changed) {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            "blockchainRefs.statusUpdated": currentProofs,
          },
        }
      );
      order.blockchainRefs = {
        ...(order.blockchainRefs?.toObject?.() || order.blockchainRefs || {}),
        statusUpdated: currentProofs,
      };
    }
  } catch (error) {
    // Tracking should still render even if historical proof recovery is unavailable.
  }

  return order;
}

function toPublicOrder(doc) {
  const order = doc.toObject ? doc.toObject() : doc;
  
  // Extra safety check for populated names
  const farmerName = order.farmerId?.name || (doc.farmerId && doc.farmerId.name) || "Verified Farmer";
  const buyerName = order.buyerId?.name || (doc.buyerId && doc.buyerId.name) || "Verified Buyer";
  const farmerContact = normalizeContact(order.farmerContact, order.farmerId || {});
  const buyerContact = normalizeContact(order.buyerContact, order.buyerId || {});

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
    buyerContact: {
      ...buyerContact,
      name: buyerContact.name || buyerName,
    },
    farmerContact: {
      ...farmerContact,
      name: farmerContact.name || farmerName,
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
    .populate("buyerId", "name email phone phoneExtension address")
    .populate("farmerId", "name email phone phoneExtension address")
    .populate("productId")
    .sort({ createdAt: -1 });

  await Promise.all(orders.map((order) => backfillStatusProofs(order)));

  return res.json({ orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("buyerId", "name email phone phoneExtension address")
    .populate("farmerId", "name email phone phoneExtension address")
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
  const { productId, quantity, paymentMethod, buyerContact: rawBuyerContact } = req.body;

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

  if (paymentMethod === "upi" && !isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Razorpay test mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.");
  }

  const product = await Product.findById(productId).populate("farmerId", "name email phone phoneExtension address");
  if (!product || !product.isAvailable || product.isDeleted) {
    res.status(404);
    throw new Error("Product is not available.");
  }

  if (numericQuantity > Number(product.quantity)) {
    res.status(400);
    throw new Error("Requested quantity exceeds the available stock.");
  }

  const buyerContact = {
    ...normalizeContact(rawBuyerContact, req.user),
    name: normalizeString(req.user.name || rawBuyerContact?.name || "Buyer"),
  };
  const buyerContactValidationError = getBuyerContactValidationError(buyerContact);
  if (buyerContactValidationError) {
    res.status(400);
    throw new Error(buyerContactValidationError);
  }

  const farmerProfile = product.farmerId?.toObject ? product.farmerId.toObject() : product.farmerId;
  const farmerContact = normalizeContact(
    {
      ...farmerProfile,
      address: {
        ...(farmerProfile?.address || {}),
        place:
          farmerProfile?.address?.place ||
          farmerProfile?.address?.village ||
          farmerProfile?.address?.district ||
          product.originLocation,
      },
    },
    farmerProfile
  );

  const orderNumber = await generateOrderNumber(Order);
  const totalPaise = Number(product.pricePaise) * numericQuantity;

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
    farmerId: product.farmerId._id,
    productId: product._id,
    buyerContact,
    farmerContact,
    blockchainProductId: product.blockchainProductId,
    quantity: Number(quantity),
    totalPaise,
    platformFeePaise: Math.floor(totalPaise * 0.2),
    status: "pending",
    paymentMethod,
    paymentStatus: "pending",
    paymentReference: "",
    paymentGateway: {
      provider: paymentMethod === "upi" ? "razorpay" : "",
    },
    blockchainOrderId: blockchainResult.blockchainOrderId,
    blockchainRefs: {
      orderCreated: blockchainResult.receipt.transactionHash,
    },
    statusHistory: [{ status: "pending", changedAt: new Date() }],
  });

  const populatedOrder = await Order.findById(order._id)
    .populate("buyerId", "name email phone phoneExtension address")
    .populate("farmerId", "name email phone phoneExtension address")
    .populate("productId");

  return res.status(201).json({
    order: populatedOrder,
    paymentIntent:
      paymentMethod === "upi"
        ? {
            amountPaise: totalPaise,
            method: "upi",
            provider: "razorpay",
            requiresAction: true,
          }
        : null,
    message:
      paymentMethod === "upi"
        ? "Order created. Complete the payment with Razorpay Test Mode to continue."
        : "COD order created successfully.",
  });
});

const createPaymentOrder = asyncHandler(async (req, res) => {
  const order = await getOrderWithRelations(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  ensureBuyerOwnsOrder(order, req.user._id, res);
  ensureOnlinePaymentOrder(order, res);

  if (order.paymentStatus === "paid") {
    res.status(400);
    throw new Error("This Razorpay order is already marked as paid.");
  }

  if (!["pending", "failed"].includes(order.paymentStatus)) {
    res.status(400);
    throw new Error("This order is no longer eligible for payment.");
  }

  if (!isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Razorpay test mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.");
  }

  const razorpayOrder = await createCheckoutOrder({
    amountPaise: order.totalPaise,
    receipt: order.orderNumber,
    notes: {
      internalOrderId: order._id.toString(),
      orderNumber: order.orderNumber,
      productName: order.productId?.name || "Farm produce",
    },
  });

  order.paymentGateway = {
    provider: "razorpay",
    orderId: razorpayOrder.id,
    paymentId: "",
    signature: "",
  };
  await order.save();

  return res.json({
    checkout: {
      keyId: getRazorpayKeyId(),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      description: `${order.productId?.name || "Farm produce"} - ${order.orderNumber}`,
      name: "AgriChain Local",
      notes: razorpayOrder.notes || {},
      orderId: razorpayOrder.id,
      prefill: {
        contact: getBuyerPhoneForCheckout(order.buyerContact),
        email: order.buyerContact?.email || order.buyerId?.email || "",
        name: order.buyerContact?.name || order.buyerId?.name || "Verified Buyer",
      },
      receipt: order.orderNumber,
    },
    message: "Razorpay checkout is ready.",
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = req.body;
  const order = await getOrderWithRelations(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  ensureBuyerOwnsOrder(order, req.user._id, res);

  if (order.paymentStatus === "paid") {
    if (order.paymentGateway?.paymentId === razorpayPaymentId) {
      return res.json({
        order,
        message: "Razorpay payment already verified.",
      });
    }

    res.status(400);
    throw new Error("This Razorpay order is already marked as paid.");
  }

  ensureOnlinePaymentOrder(order, res);

  if (!["pending", "failed"].includes(order.paymentStatus)) {
    res.status(400);
    throw new Error("This order is no longer eligible for payment.");
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error("Razorpay verification payload is incomplete.");
  }

  if (!isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Razorpay test mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.");
  }

  if (!order.paymentGateway?.orderId || order.paymentGateway.orderId !== razorpayOrderId) {
    res.status(400);
    throw new Error("The Razorpay order does not match this AgriChain order.");
  }

  if (!verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    res.status(400);
    throw new Error("Razorpay signature verification failed.");
  }

  const blockchainResult = await recordPayment(order.blockchainOrderId, "paid", razorpayPaymentId);

  order.paymentStatus = "paid";
  order.paymentReference = razorpayPaymentId;
  order.paymentGateway = {
    provider: "razorpay",
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  };
  order.blockchainRefs.paymentRecorded = blockchainResult.receipt.transactionHash;
  appendPaymentHistory(order, "paid", razorpayPaymentId, blockchainResult.receipt.transactionHash);
  await order.save();

  return res.json({
    order,
    message: "Razorpay payment verified successfully.",
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
      throw new Error("Online orders must be paid before the farmer can confirm them.");
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
    .populate({ path: "farmerId", select: "name email phone phoneExtension address" })
    .populate({ path: "buyerId", select: "name email phone phoneExtension address" });

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  await backfillStatusProofs(order);

  return res.json({ order: toPublicOrder(order) });
});

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  createPaymentOrder,
  verifyPayment,
  updateOrderStatus,
  cancelOrder,
  getPublicTrackOrder,
};
