const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const generateBatchCode = require("../utils/generateBatchCode");
const {
  recordProduct,
  updateProduct,
  deactivateProduct,
  getProductFromChain,
} = require("../services/blockchainService");

function toHarvestDate(value) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("A valid harvest date is required.");
  }

  return parsedDate;
}

function toHarvestDateUnix(value) {
  return Math.floor(toHarvestDate(value).getTime() / 1000);
}

const getProducts = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = { isAvailable: true, isDeleted: false };

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const products = await Product.find(filter)
    .populate("farmerId", "name email")
    .sort({ createdAt: -1 });

  return res.json({ products });
});

const getFarmerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmerId: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
  return res.json({ products });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false }).populate("farmerId", "name email");

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  return res.json({ product });
});

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    quantity,
    unit,
    pricePaise,
    description,
    imageUrl,
    originLocation,
    harvestDate,
  } = req.body;

  if (
    !name ||
    !category ||
    quantity === undefined ||
    !unit ||
    pricePaise === undefined ||
    !originLocation ||
    !harvestDate
  ) {
    res.status(400);
    throw new Error("Name, category, quantity, unit, price, origin, and harvest date are required.");
  }

  const numericQuantity = Number(quantity);
  const numericPricePaise = Number(pricePaise);

  if (Number.isNaN(numericQuantity) || numericQuantity < 0) {
    res.status(400);
    throw new Error("Quantity must be a valid positive number.");
  }

  if (Number.isNaN(numericPricePaise) || numericPricePaise <= 0) {
    res.status(400);
    throw new Error("Price must be a valid positive number.");
  }

  const batchCode = generateBatchCode(name);
  const harvestDateValue = toHarvestDate(harvestDate);

  const blockchainResult = await recordProduct({
    name,
    category,
    unit,
    quantity: numericQuantity,
    batchCode,
    originLocation,
    harvestDateUnix: toHarvestDateUnix(harvestDate),
  });

  const product = await Product.create({
    farmerId: req.user._id,
    name,
    category,
    quantity: numericQuantity,
    unit,
    pricePaise: numericPricePaise,
    currency: "INR",
    batchCode,
    originLocation,
    harvestDate: harvestDateValue,
    description: description || "",
    imageUrl: imageUrl || "",
    blockchainProductId: blockchainResult.blockchainId,
    blockchainTxHash: blockchainResult.receipt.transactionHash,
    lastBlockchainTxHash: blockchainResult.receipt.transactionHash,
    isAvailable: true,
  });

  return res.status(201).json({ product });
});

const updateProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const isOwner = product.farmerId.toString() === req.user._id.toString();
  if (req.user.role === "farmer" && !isOwner) {
    res.status(403);
    throw new Error("You can only update your own products.");
  }

  const rawQuantity = req.body.quantity ?? product.quantity;
  const rawPricePaise = req.body.pricePaise ?? product.pricePaise;

  const nextValues = {
    name: req.body.name ?? product.name,
    category: req.body.category ?? product.category,
    quantity: Number(rawQuantity),
    unit: req.body.unit ?? product.unit,
    pricePaise: Number(rawPricePaise),
    description: req.body.description ?? product.description,
    imageUrl: req.body.imageUrl ?? product.imageUrl,
    originLocation: req.body.originLocation ?? product.originLocation,
    harvestDate: req.body.harvestDate ?? product.harvestDate,
    isAvailable: req.body.isAvailable ?? product.isAvailable,
  };

  if (Number.isNaN(nextValues.quantity) || nextValues.quantity < 0) {
    res.status(400);
    throw new Error("Quantity must be a valid positive number.");
  }

  if (Number.isNaN(nextValues.pricePaise) || nextValues.pricePaise <= 0) {
    res.status(400);
    throw new Error("Price must be a valid positive number.");
  }

  // Ensure product exists on-chain (handles local chain resets)
  try {
    await getProductFromChain(product.blockchainProductId);
  } catch (e) {
    const reRecord = await recordProduct({
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: Number(product.quantity),
      batchCode: product.batchCode,
      originLocation: product.originLocation,
      harvestDateUnix: toHarvestDateUnix(product.harvestDate),
    });
    product.blockchainProductId = reRecord.blockchainId;
    product.blockchainTxHash = reRecord.receipt.transactionHash;
    product.lastBlockchainTxHash = reRecord.receipt.transactionHash;
    await product.save();
  }

  const blockchainResult = await updateProduct({
    blockchainId: product.blockchainProductId,
    name: nextValues.name,
    category: nextValues.category,
    unit: nextValues.unit,
    quantity: nextValues.quantity,
    batchCode: product.batchCode,
    originLocation: nextValues.originLocation,
    harvestDateUnix: toHarvestDateUnix(nextValues.harvestDate),
    isActive: Boolean(nextValues.isAvailable),
  });

  product.name = nextValues.name;
  product.category = nextValues.category;
  product.quantity = nextValues.quantity;
  product.unit = nextValues.unit;
  product.pricePaise = nextValues.pricePaise;
  product.description = nextValues.description;
  product.imageUrl = nextValues.imageUrl;
  product.originLocation = nextValues.originLocation;
  product.harvestDate = toHarvestDate(nextValues.harvestDate);
  product.isAvailable = Boolean(nextValues.isAvailable);
  product.lastBlockchainTxHash = blockchainResult.receipt.transactionHash;

  await product.save();

  return res.json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const isOwner = product.farmerId.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You can only remove your own products.");
  }

  // Ensure product exists on-chain; if not, re-record and then deactivate
  try {
    await getProductFromChain(product.blockchainProductId);
  } catch (e) {
    const reRecord = await recordProduct({
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: Number(product.quantity),
      batchCode: product.batchCode,
      originLocation: product.originLocation,
      harvestDateUnix: toHarvestDateUnix(product.harvestDate),
    });
    product.blockchainProductId = reRecord.blockchainId;
    product.blockchainTxHash = reRecord.receipt.transactionHash;
    product.lastBlockchainTxHash = reRecord.receipt.transactionHash;
    await product.save();
  }

  const blockchainResult = await deactivateProduct(product.blockchainProductId);

  product.isAvailable = false;
  product.isDeleted = true;
  product.lastBlockchainTxHash = blockchainResult.receipt.transactionHash;
  await product.save();

  return res.json({ message: "Product has been removed from the marketplace." });
});

module.exports = {
  getProducts,
  getFarmerProducts,
  getProductById,
  createProduct,
  updateProduct: updateProductById,
  deleteProduct,
};
