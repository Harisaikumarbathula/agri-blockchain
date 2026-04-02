import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import OrderTimeline from "../components/OrderTimeline";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import {
  extractErrorMessage,
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  shortenHash,
} from "../utils/formatters";

function canCancel(order) {
  if (order.status !== "pending") {
    return false;
  }

  if (order.paymentMethod === "cod") {
    return true;
  }

  return ["pending", "failed"].includes(order.paymentStatus);
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders");
      setOrders(data.orders);
      setError("");
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (order) => {
    setBusyOrderId(order._id);
    setError("");
    setMessage("");

    try {
      const { data } = await api.delete(`/orders/${order._id}`);
      setMessage(data.message);
      await loadOrders();
    } catch (cancelError) {
      setError(extractErrorMessage(cancelError));
    } finally {
      setBusyOrderId("");
    }
  };

  const handleConfirmDelivery = async (order) => {
    setBusyOrderId(order._id);
    setError("");
    setMessage("");

    try {
      const { data } = await api.put(`/orders/${order._id}/status`, {
        status: "delivered",
      });

      setMessage(data.message);
      await loadOrders();
    } catch (deliveryError) {
      setError(extractErrorMessage(deliveryError));
    } finally {
      setBusyOrderId("");
    }
  };

  const handleSimulatePayment = async (order, outcome) => {
    setBusyOrderId(order._id);
    setError("");
    setMessage("");

    try {
      const { data } = await api.post(`/orders/${order._id}/payment/simulate`, { outcome });
      setMessage(data.message);
      await loadOrders();
    } catch (paymentError) {
      setError(extractErrorMessage(paymentError));
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Buyer order tracking</span>
          <h1>My Orders</h1>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={message} />

      {loading ? (
        <Loader label="Loading your orders..." />
      ) : orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        <div className="stack">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card__header">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p className="muted">
                    {order.productId?.name} • Farmer: {order.farmerId?.name}
                  </p>
                </div>
                <div className="meta-grid">
                  <span>Total: {formatCurrency(order.totalPaise)}</span>
                  <span>Ordered: {formatDate(order.createdAt)}</span>
                  <span>Method: {formatPaymentMethod(order.paymentMethod)}</span>
                  <span>Payment: {order.paymentStatus}</span>
                  <span>Order Tx: {shortenHash(order.blockchainRefs?.orderCreated)}</span>
                </div>
              </div>

              <OrderTimeline
                status={order.status}
                paymentStatus={order.paymentStatus}
                paymentMethod={order.paymentMethod}
              />

              <div className="card__actions">
                {order.paymentMethod === "upi" &&
                  order.status === "pending" &&
                  order.paymentStatus !== "paid" && (
                    <>
                      <button
                        className="btn btn--primary"
                        onClick={() => handleSimulatePayment(order, "paid")}
                        disabled={busyOrderId === order._id}
                      >
                        {busyOrderId === order._id ? "Working..." : "Simulate UPI Success"}
                      </button>
                      <button
                        className="btn btn--secondary"
                        onClick={() => handleSimulatePayment(order, "failed")}
                        disabled={busyOrderId === order._id}
                      >
                        Mark UPI Failed
                      </button>
                    </>
                  )}

                {canCancel(order) && (
                  <button
                    className="btn btn--danger"
                    onClick={() => handleCancel(order)}
                    disabled={busyOrderId === order._id}
                  >
                    {busyOrderId === order._id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}

                {order.status === "shipped" && (
                  <button
                    className="btn btn--primary"
                    onClick={() => handleConfirmDelivery(order)}
                    disabled={busyOrderId === order._id}
                  >
                    {busyOrderId === order._id ? "Confirming..." : "Confirm Delivery"}
                  </button>
                )}

                <Link className="btn btn--ghost" to={`/track/${order.orderNumber}`}>
                  Public Traceability
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
