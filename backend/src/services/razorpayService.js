const crypto = require("crypto");
const Razorpay = require("razorpay");

let razorpayInstance;

function getCredentials() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || "",
  };
}

function isRazorpayConfigured() {
  const { keyId, keySecret } = getCredentials();
  return Boolean(keyId && keySecret);
}

function getRazorpayKeyId() {
  return getCredentials().keyId;
}

function getRazorpayInstance() {
  if (!razorpayInstance) {
    const { keyId, keySecret } = getCredentials();
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

async function createCheckoutOrder({ amountPaise, receipt, notes = {} }) {
  return getRazorpayInstance().orders.create({
    amount: Number(amountPaise),
    currency: "INR",
    receipt,
    notes,
  });
}

function verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const { keySecret } = getCredentials();
  const digest = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return digest === razorpaySignature;
}

module.exports = {
  isRazorpayConfigured,
  getRazorpayKeyId,
  createCheckoutOrder,
  verifyCheckoutSignature,
};
