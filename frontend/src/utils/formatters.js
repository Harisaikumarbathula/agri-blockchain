export const statusSteps = ["pending", "confirmed", "shipped", "out_for_delivery", "delivered"];

export function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateInput(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function shortenHash(hash) {
  if (!hash) {
    return "";
  }

  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export function isWithinCancellationWindow(createdAt) {
  if (!createdAt) {
    return false;
  }

  return Date.now() - new Date(createdAt).getTime() <= 60 * 60 * 1000;
}

export function formatPaymentMethod(value) {
  return value === "cod" ? "Cash on Delivery" : "UPI";
}

export function formatStatusLabel(value) {
  if (!value) {
    return "-";
  }
  
  if (value === "out_for_delivery") {
    return "Out for delivery";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
