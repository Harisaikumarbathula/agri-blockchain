function generatePaymentReference(orderNumber, mode = "UPI", attempt = 1) {
  const prefix = mode.toUpperCase();
  const timestamp = Date.now();
  const retrySuffix = attempt > 1 ? `-R${attempt}` : "";

  return `${prefix}-${orderNumber}-${timestamp}${retrySuffix}`;
}

module.exports = generatePaymentReference;
