function generateBatchCode(productName) {
  const prefix = (productName || "AGRI")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 4) || "AGRI";
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
}

module.exports = generateBatchCode;

