import api from "../api/client";
import { extractErrorMessage } from "./formatters";

let razorpayScriptPromise;

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error("Unable to load Razorpay Checkout right now."));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function openRazorpayCheckout(checkout) {
  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay({
      amount: checkout.amount,
      currency: checkout.currency,
      description: checkout.description,
      key: checkout.keyId,
      name: checkout.name,
      notes: checkout.notes,
      order_id: checkout.orderId,
      prefill: checkout.prefill,
      theme: {
        color: "#2f6f3e",
      },
      handler(response) {
        resolve(response);
      },
      modal: {
        ondismiss() {
          const error = new Error("Payment window closed before completion.");
          error.code = "RAZORPAY_DISMISSED";
          reject(error);
        },
      },
    });

    razorpay.on("payment.failed", (response) => {
      const error = new Error(response.error?.description || "Razorpay test payment failed.");
      error.code = "RAZORPAY_FAILED";
      error.details = response.error;
      reject(error);
    });

    razorpay.open();
  });
}

export async function payOrderWithRazorpay(order) {
  await loadRazorpayScript();

  const { data: paymentOrder } = await api.post(`/orders/${order._id}/payment/order`);
  const paymentResponse = await openRazorpayCheckout(paymentOrder.checkout);
  const { data } = await api.post(`/orders/${order._id}/payment/verify`, paymentResponse);

  return data;
}

export function isRazorpayDismissed(error) {
  return error?.code === "RAZORPAY_DISMISSED";
}

export function getRazorpayErrorMessage(error) {
  if (error?.code === "RAZORPAY_DISMISSED") {
    return "Payment was cancelled. You can retry whenever you're ready.";
  }

  return extractErrorMessage(error);
}
