const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["vegetables", "fruits", "grains", "dairy", "other"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "dozen", "piece", "liter"],
      required: true,
    },
    pricePaise: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    originLocation: {
      type: String,
      required: true,
      trim: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    blockchainId: {
      type: Number,
      required: true,
      unique: true,
    },
    blockchainTxHash: {
      type: String,
      required: true,
      trim: true,
    },
    lastBlockchainTxHash: {
      type: String,
      default: "",
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
