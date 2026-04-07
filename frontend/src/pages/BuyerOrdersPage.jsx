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

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/orders");
      setOrders(data.orders);
      setError("");
    } catch (loadError) {
      if (!silent) setError(extractErrorMessage(loadError));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const intervalId = setInterval(() => {
      loadOrders(true);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
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
    <section className="stack" style={{ gap: '3rem' }}>
      <header>
        <div className="eyebrow">Your Purchases</div>
        <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>My Orders</h1>
        <p style={{ color: 'var(--color-muted)', fontWeight: '500', fontSize: '1.1rem' }}>Track your fresh produce from the farm to your doorstep.</p>
      </header>

      {error && <Alert type="danger" message={error} />}
      {message && <Alert type="success" message={message} />}

      {loading ? (
        <Loader label="Fetching your order history..." />
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', borderStyle: 'dashed', background: 'var(--color-background)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--color-primary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>No orders yet</h2>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500', marginBottom: '2rem' }}>You haven't made any purchases yet. Explore the marketplace for fresh produce!</p>
          <Link to="/marketplace" className="btn btn--primary btn--large">Shop Marketplace</Link>
        </div>
      ) : (
        <div className="stack" style={{ gap: '2rem' }}>
          {orders.map((order) => (
            <div key={order._id} className="card stack" style={{ gap: '1.5rem', padding: '0', overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div className="stack" style={{ gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>Order Number</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{order.orderNumber}</strong>
                  </div>
                  <div className="stack" style={{ gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>Placed On</span>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={`badge badge--${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                    {order.status}
                  </span>
                  <Link to={`/track/${order.orderNumber}`} className="btn btn--secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Track Journey
                  </Link>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flex: 1, minWidth: '300px' }}>
                  <div style={{ width: '100px', height: '100px', background: 'var(--color-background)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                    {order.productId?.imageUrl ? (
                      <img src={order.productId.imageUrl} alt={order.productId.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
                    )}
                  </div>
                  <div className="stack" style={{ gap: '0.5rem', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text)' }}>{order.productId?.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {order.farmerId?.name}'s Farm
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--color-text)', marginTop: '0.25rem' }}>
                      <span style={{ color: 'var(--color-primary)' }}>{order.quantity} {order.productId?.unit}</span>
                      <span style={{ color: 'var(--color-border)' }}>|</span>
                      <span>{formatCurrency(order.totalPaise)} total</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ minWidth: '280px', background: 'var(--color-background)', border: 'none', padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>Payment Details</span>
                  <div className="stack" style={{ gap: '0.75rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Method</span>
                      <span className="badge badge--info" style={{ fontSize: '0.65rem' }}>{formatPaymentMethod(order.paymentMethod)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Status</span>
                      <span className={`badge badge--${order.paymentStatus === 'paid' ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem' }}>{order.paymentStatus}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Blockchain Hash</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-muted)' }}>{shortenHash(order.blockchainHash)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {((order.paymentMethod === "upi" && order.status === "pending" && order.paymentStatus !== "paid") || canCancel(order) || ["shipped", "out_for_delivery"].includes(order.status)) && (
                <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', background: 'var(--color-background)' }}>
                  {order.paymentMethod === "upi" && order.status === "pending" && order.paymentStatus !== "paid" && (
                    <>
                      <button className="btn btn--primary" onClick={() => handleSimulatePayment(order, "paid")} disabled={busyOrderId === order._id} style={{ flex: 1 }}>
                        {busyOrderId === order._id ? "Processing..." : "Complete UPI Payment"}
                      </button>
                      <button className="btn btn--secondary" onClick={() => handleSimulatePayment(order, "failed")} disabled={busyOrderId === order._id}>
                        Simulate Failure
                      </button>
                    </>
                  )}

                  {canCancel(order) && (
                    <button className="btn btn--secondary" style={{ color: 'var(--color-danger)', borderColor: 'rgba(244, 67, 54, 0.2)' }} onClick={() => handleCancel(order)} disabled={busyOrderId === order._id}>
                      {busyOrderId === order._id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}

                  {["shipped", "out_for_delivery"].includes(order.status) && (
                    <button className="btn btn--primary btn--large" style={{ flex: 1 }} onClick={() => handleConfirmDelivery(order)} disabled={busyOrderId === order._id}>
                      {busyOrderId === order._id ? "Confirming..." : "Confirm Delivery Receipt"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
