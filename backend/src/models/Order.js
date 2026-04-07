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
    buyerContact: {
      name: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      phoneExtension: {
        type: String,
        default: "",
        trim: true,
      },
      phone: {
        type: String,
        default: "",
        trim: true,
      },
      address: {
        place: {
          type: String,
          default: "",
          trim: true,
        },
        state: {
          type: String,
          default: "",
          trim: true,
        },
        country: {
          type: String,
          default: "",
          trim: true,
        },
        pincode: {
          type: String,
          default: "",
          trim: true,
        },
      },
    },
    farmerContact: {
      name: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      phoneExtension: {
        type: String,
        default: "",
        trim: true,
      },
      phone: {
        type: String,
        default: "",
        trim: true,
      },
      address: {
        place: {
          type: String,
          default: "",
          trim: true,
        },
        state: {
          type: String,
          default: "",
          trim: true,
        },
        country: {
          type: String,
          default: "",
          trim: true,
        },
        pincode: {
          type: String,
          default: "",
          trim: true,
        },
      },
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
      enum: ["pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"],
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
    paymentGateway: {
      provider: {
        type: String,
        enum: ["", "razorpay"],
        default: "",
        trim: true,
      },
      orderId: {
        type: String,
        default: "",
        trim: true,
      },
      paymentId: {
        type: String,
        default: "",
        trim: true,
      },
      signature: {
        type: String,
        default: "",
        trim: true,
      },
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
        out_for_delivery: {
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
          enum: ["pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"],
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
    location: {
      lat: {
        type: Number,
        default: 21.1458, // default central India
      },
      lng: {
        type: Number,
        default: 79.0882,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
