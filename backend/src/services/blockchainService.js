const {
  getWeb3,
  getSignerAccount,
  getContract,
  getBlockchainMetadata,
} = require("../config/web3");

const paymentMethodMap = {
  upi: 0,
  cod: 1,
};

const paymentMethodReverseMap = {
  0: "upi",
  1: "cod",
};

const paymentStatusMap = {
  pending: 0,
  paid: 1,
  failed: 2,
  collected: 3,
};

const paymentStatusReverseMap = {
  0: "pending",
  1: "paid",
  2: "failed",
  3: "collected",
};

const orderStatusMap = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  cancelled: 4,
};

const orderStatusReverseMap = {
  0: "pending",
  1: "confirmed",
  2: "shipped",
  3: "delivered",
  4: "cancelled",
};

async function sendContractTransaction(methodBuilder) {
  const web3 = getWeb3();
  const signer = getSignerAccount();
  const gasPrice = await web3.eth.getGasPrice();
  const estimatedGas = await methodBuilder.estimateGas({ from: signer.address });

  return methodBuilder.send({
    from: signer.address,
    gas: Math.ceil(Number(estimatedGas) * 1.2),
    gasPrice,
  });
}

function getProductFromReceipt(receipt) {
  return receipt.events?.ProductRecorded?.returnValues;
}

function getOrderFromReceipt(receipt) {
  return receipt.events?.OrderRecorded?.returnValues;
}

function toPaymentMethodEnum(paymentMethod) {
  if (!(paymentMethod in paymentMethodMap)) {
    throw new Error("Unsupported payment method.");
  }

  return paymentMethodMap[paymentMethod];
}

function toPaymentStatusEnum(paymentStatus) {
  if (!(paymentStatus in paymentStatusMap)) {
    throw new Error("Unsupported payment status.");
  }

  return paymentStatusMap[paymentStatus];
}

function toOrderStatusEnum(orderStatus) {
  if (!(orderStatus in orderStatusMap)) {
    throw new Error("Unsupported order status.");
  }

  return orderStatusMap[orderStatus];
}

async function recordProduct(productInput) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.recordProduct(
      productInput.name,
      productInput.category,
      productInput.unit,
      Number(productInput.quantity),
      productInput.batchCode,
      productInput.originLocation,
      Number(productInput.harvestDateUnix)
    )
  );

  const event = getProductFromReceipt(receipt);

  return {
    receipt,
    blockchainId: Number(event.productId),
  };
}

async function updateProduct(productInput) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.updateProduct(
      Number(productInput.blockchainId),
      productInput.name,
      productInput.category,
      productInput.unit,
      Number(productInput.quantity),
      productInput.batchCode,
      productInput.originLocation,
      Number(productInput.harvestDateUnix),
      Boolean(productInput.isActive)
    )
  );

  return { receipt };
}

async function deactivateProduct(blockchainId) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.deactivateProduct(Number(blockchainId))
  );

  return { receipt };
}

async function recordOrder(orderInput) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.recordOrder(
      orderInput.orderNumber,
      Number(orderInput.productBlockchainId),
      Number(orderInput.quantity),
      Number(orderInput.totalPaise),
      toPaymentMethodEnum(orderInput.paymentMethod),
      toPaymentStatusEnum(orderInput.paymentStatus)
    )
  );

  const event = getOrderFromReceipt(receipt);

  return {
    receipt,
    blockchainOrderId: Number(event.orderId),
  };
}

async function recordPayment(blockchainOrderId, paymentStatus, paymentReference) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.recordPayment(
      Number(blockchainOrderId),
      toPaymentStatusEnum(paymentStatus),
      paymentReference
    )
  );

  return { receipt };
}

async function updateOrderStatus(blockchainOrderId, orderStatus) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.updateOrderStatus(Number(blockchainOrderId), toOrderStatusEnum(orderStatus))
  );

  return { receipt };
}

async function cancelOrder(blockchainOrderId) {
  const contract = getContract();
  const receipt = await sendContractTransaction(contract.methods.cancelOrder(Number(blockchainOrderId)));

  return { receipt };
}

async function recordCodCollected(blockchainOrderId, paymentReference) {
  const contract = getContract();
  const receipt = await sendContractTransaction(
    contract.methods.recordCodCollected(Number(blockchainOrderId), paymentReference)
  );

  return { receipt };
}

async function getProductFromChain(blockchainId) {
  const contract = getContract();
  return contract.methods.getProduct(Number(blockchainId)).call();
}

async function getOrderFromChain(blockchainOrderId) {
  const contract = getContract();
  return contract.methods.getOrder(Number(blockchainOrderId)).call();
}

function getOrderStatusLabel(statusNumber) {
  return orderStatusReverseMap[Number(statusNumber)] || "pending";
}

function getPaymentStatusLabel(statusNumber) {
  return paymentStatusReverseMap[Number(statusNumber)] || "pending";
}

function getPaymentMethodLabel(methodNumber) {
  return paymentMethodReverseMap[Number(methodNumber)] || "upi";
}

module.exports = {
  recordProduct,
  updateProduct,
  deactivateProduct,
  recordOrder,
  recordPayment,
  updateOrderStatus,
  cancelOrder,
  recordCodCollected,
  getProductFromChain,
  getOrderFromChain,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getBlockchainMetadata,
};
