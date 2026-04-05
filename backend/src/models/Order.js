const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    blockchainProductId: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    platformFeePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "collected"],
      default: "pending",
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    blockchainOrderId: {
      type: Number,
      required: true,
    },
    blockchainRefs: {
      orderCreated: {
        type: String,
        default: "",
        trim: true,
      },
      paymentRecorded: {
        type: String,
        default: "",
        trim: true,
      },
      statusUpdated: {
        confirmed: {
          type: String,
          default: "",
          trim: true,
        },
        shipped: {
          type: String,
          default: "",
          trim: true,
        },
        delivered: {
          type: String,
          default: "",
          trim: true,
        },
      },
      cancelled: {
        type: String,
        default: "",
        trim: true,
      },
      codCollected: {
        type: String,
        default: "",
        trim: true,
      },
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "paid", "failed", "collected"],
          required: true,
        },
        reference: {
          type: String,
          default: "",
          trim: true,
        },
        txHash: {
          type: String,
          default: "",
          trim: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
