import { useState } from "react";
import api from "../api/client";
import { useCart } from "../contexts/CartContext";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { extractErrorMessage, formatCurrency, formatPaymentMethod } from "../utils/formatters";

export default function CartPage() {
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [placingOrders, setPlacingOrders] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutOrders, setCheckoutOrders] = useState([]);

  const handleCheckout = async () => {
    setPlacingOrders(true);
    setError("");
    setMessage("");
    const completedProductIds = [];
    const createdOrders = [];

    try {
      for (const item of items) {
        const { data } = await api.post("/orders", {
          productId: item.product._id,
          quantity: Number(item.quantity),
          paymentMethod,
        });

        completedProductIds.push(item.product._id);
        createdOrders.push(data.order);
      }

      completedProductIds.forEach((id) => removeFromCart(id));
      setCheckoutOrders(createdOrders);
      setMessage(
        paymentMethod === "upi"
          ? "Orders created. Simulate each UPI payment below."
          : "COD orders created successfully."
      );
    } catch (checkoutError) {
      completedProductIds.forEach((id) => removeFromCart(id));
      setError(extractErrorMessage(checkoutError));
    } finally {
      setPlacingOrders(false);
    }
  };

  const handleSimulatePayment = async (orderId, outcome) => {
    setBusyOrderId(orderId);
    setError("");
    setMessage("");

    try {
      const { data } = await api.post(`/orders/${orderId}/payment/simulate`, {
        outcome,
      });

      setCheckoutOrders((current) =>
        current.map((order) => (order._id === orderId ? data.order : order))
      );
      setMessage(data.message);
    } catch (paymentError) {
      setError(extractErrorMessage(paymentError));
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <section className="stack" style={{ gap: '3rem' }}>
      <header>
        <div className="eyebrow">Checkout</div>
        <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>Your Shopping Cart</h1>
        <p style={{ color: 'var(--color-muted)', fontWeight: '500', fontSize: '1.1rem' }}>Review your items and complete your purchase securely.</p>
      </header>

      {error && <Alert type="danger" message={error} />}
      {message && <Alert type="success" message={message} />}
      {placingOrders && <Loader label="Securing your order on the blockchain..." />}

      {checkoutOrders.length > 0 && (
        <div className="card stack" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Order Confirmation</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {checkoutOrders.map((order) => (
              <div key={order._id} className="card" style={{ padding: '1.25rem', background: 'var(--color-background)', borderStyle: 'dashed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-primary)' }}>{order.orderNumber}</span>
                    <span className="badge badge--info" style={{ fontSize: '0.65rem' }}>{formatPaymentMethod(order.paymentMethod)}</span>
                  </div>
                  <span className={`badge badge--${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{order.paymentStatus}</span>
                </div>
                
                <div className="meta-grid" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Product</span>
                    <span style={{ fontWeight: '600' }}>{order.productId?.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Total Amount</span>
                    <span style={{ fontWeight: '800', color: 'var(--color-text)' }}>{formatCurrency(order.totalPaise)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Reference</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.paymentReference || "N/A"}</span>
                  </div>
                </div>

                {order.paymentMethod === "upi" && order.paymentStatus === "pending" && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <button 
                      className="btn btn--primary" 
                      style={{ flex: 1 }} 
                      disabled={busyOrderId === order._id}
                      onClick={() => handleSimulatePayment(order._id, "paid")}
                    >
                      {busyOrderId === order._id ? "Processing..." : "Simulate Success"}
                    </button>
                    <button 
                      className="btn btn--secondary" 
                      style={{ flex: 1, color: 'var(--color-danger)' }} 
                      disabled={busyOrderId === order._id}
                      onClick={() => handleSimulatePayment(order._id, "failed")}
                    >
                      Simulate Failure
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', borderStyle: 'dashed', background: 'var(--color-background)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--color-primary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500', marginBottom: '2rem' }}>Looks like you haven't added any fresh produce yet.</p>
          <button className="btn btn--primary btn--large" onClick={() => window.location.href = '/marketplace'}>Browse Marketplace</button>
        </div>
      ) : (
        <div className="split-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="stack">
            <h2 style={{ fontSize: '1.5rem' }}>Items in Cart ({items.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div key={item.product._id} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--color-background)', overflow: 'hidden', flexShrink: 0 }}>
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', opacity: 0.3 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.product.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600' }}>{formatCurrency(item.product.pricePaise)} / {item.product.unit}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-background)', borderRadius: 'var(--radius-full)', padding: '0.25rem', border: '1px solid var(--color-border)' }}>
                      <button 
                        className="btn btn--ghost" 
                        style={{ padding: '0.25rem 0.75rem', minWidth: 'auto' }}
                        onClick={() => updateQuantity(item.product._id, Number(item.quantity) - 1)}
                      >−</button>
                      <span style={{ width: '30px', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem' }}>{item.quantity}</span>
                      <button 
                        className="btn btn--ghost" 
                        style={{ padding: '0.25rem 0.75rem', minWidth: 'auto' }}
                        onClick={() => updateQuantity(item.product._id, Number(item.quantity) + 1)}
                      >+</button>
                    </div>
                    <button 
                      className="btn btn--ghost" 
                      style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--color-danger)' }}
                      onClick={() => removeFromCart(item.product._id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stack">
            <div className="card" style={{ position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h2>
              
              <div className="stack" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)', fontWeight: '600' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)', fontWeight: '600' }}>
                  <span>Delivery Fee</span>
                  <span style={{ color: 'var(--color-primary)' }}>Free</span>
                </div>
                <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text)' }}>
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="stack" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>Payment Method</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button 
                    className={paymentMethod === 'upi' ? 'btn btn--primary' : 'btn btn--secondary'} 
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setPaymentMethod('upi')}
                  >UPI Payment</button>
                  <button 
                    className={paymentMethod === 'cod' ? 'btn btn--primary' : 'btn btn--secondary'} 
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setPaymentMethod('cod')}
                  >Cash on Delivery</button>
                </div>
              </div>

              <button 
                className="btn btn--primary btn--large btn--block" 
                disabled={placingOrders}
                onClick={handleCheckout}
              >
                {placingOrders ? "Securing Proofs..." : "Place Secure Order"}
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '1.5rem', lineHeight: '1.5' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.4rem', color: 'var(--color-primary)' }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Your transaction is protected by end-to-end blockchain verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
