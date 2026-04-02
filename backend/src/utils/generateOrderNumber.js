async function generateOrderNumber(OrderModel) {
  const orderCount = await OrderModel.countDocuments();
  return `ORD-${String(orderCount + 1).padStart(4, "0")}`;
}

module.exports = generateOrderNumber;

