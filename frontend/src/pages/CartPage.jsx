import { useState } from "react";
import api from "../api/client";
import { useCart } from "../contexts/CartContext";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { extractErrorMessage, formatCurrency, formatPaymentMethod } from "../utils/formatters";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [placingOrders, setPlacingOrders] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutGroups, setCheckoutGroups] = useState([]);

  // Group items by farmer
  const groupedItems = items.reduce((acc, item) => {
    const farmerId = item.product.farmerId?._id || item.product.farmerId;
    const farmerName = item.product.farmerId?.name || "Verified Farmer";
    
    if (!acc[farmerId]) {
      acc[farmerId] = {
        farmerId,
        farmerName,
        items: [],
        total: 0
      };
    }
    acc[farmerId].items.push(item);
    acc[farmerId].total += item.product.pricePaise * item.quantity;
    return acc;
  }, {});

  const farmerGroups = Object.values(groupedItems);
  const cartTotal = items.reduce((sum, item) => sum + item.product.pricePaise * item.quantity, 0);

  const handleCheckout = async () => {
    setPlacingOrders(true);
    setError("");
    setMessage("");
    const completedProductIds = [];
    const createdGroups = [];

    try {
      for (const group of farmerGroups) {
        const groupOrders = [];
        for (const item of group.items) {
          const { data } = await api.post("/orders", {
            productId: item.product._id,
            quantity: Number(item.quantity),
            paymentMethod,
          });
          completedProductIds.push(item.product._id);
          groupOrders.push(data.order);
        }
        createdGroups.push({
          farmerName: group.farmerName,
          orders: groupOrders,
          total: groupOrders.reduce((sum, o) => sum + o.totalPaise, 0)
        });
      }

      completedProductIds.forEach((id) => removeFromCart(id));
      setCheckoutGroups(createdGroups);
      setMessage(
        paymentMethod === "upi"
          ? "Orders created by farmer. Simulate payments below."
          : "COD orders created successfully."
      );
    } catch (checkoutError) {
      completedProductIds.forEach((id) => removeFromCart(id));
      setError(extractErrorMessage(checkoutError));
    } finally {
      setPlacingOrders(false);
    }
  };

  const handleSimulatePayment = async (orderId, groupIdx, outcome) => {
    setBusyOrderId(orderId);
    setError("");
    setMessage("");

    try {
      const { data } = await api.post(`/orders/${orderId}/payment/simulate`, {
        outcome,
      });

      setCheckoutGroups((current) =>
        current.map((group, gIdx) => 
          gIdx === groupIdx 
            ? { ...group, orders: group.orders.map(o => o._id === orderId ? data.order : o) }
            : group
        )
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

      {checkoutGroups.length > 0 && (
        <div className="stack" style={{ gap: '2rem' }}>
          {checkoutGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="card stack" style={{ borderLeft: '4px solid var(--color-primary)', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="stack" style={{ gap: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.75rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Farmer Invoice</h2>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>By {group.farmerName}</span>
                </div>
                <div className="badge badge--success" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  {group.orders.length} {group.orders.length === 1 ? 'Item' : 'Items'} Secured
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-background)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--color-border)', color: 'var(--color-muted)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Produce & Order #</span>
                  <span style={{ textAlign: 'center' }}>Quantity</span>
                  <span style={{ textAlign: 'right' }}>Amount</span>
                  <span style={{ textAlign: 'right' }}>Payment Status</span>
                </div>

                {group.orders.map((order) => (
                  <div key={order._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '1rem', alignItems: 'center', padding: '0.5rem 0' }}>
                    <div className="stack" style={{ gap: '0.25rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>{order.productId?.name}</span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: '700' }}>{order.orderNumber}</span>
                    </div>
                    <span style={{ textAlign: 'center', fontWeight: '600', color: 'var(--color-muted)' }}>{order.quantity} {order.productId?.unit}</span>
                    <span style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-text)' }}>{formatCurrency(order.totalPaise)}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge--${order.paymentStatus === 'paid' ? 'success' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                        {order.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '2px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <div className="stack" style={{ alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Farmer Bill Total</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-text)', letterSpacing: '-0.04em' }}>
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                </div>
              </div>

              {paymentMethod === "upi" && group.orders.some(o => o.paymentStatus === "pending") && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-primary-light)', borderRadius: '16px', border: '1px solid var(--color-primary)' }}>
                  <button 
                    className="btn btn--primary" 
                    style={{ width: '100%', padding: '1rem' }} 
                    disabled={busyOrderId === "all-" + groupIdx}
                    onClick={async () => {
                      setBusyOrderId("all-" + groupIdx);
                      for (const order of group.orders) {
                        if (order.paymentStatus === "pending") {
                          await handleSimulatePayment(order._id, groupIdx, "paid");
                        }
                      }
                      setBusyOrderId("");
                    }}
                  >
                    {busyOrderId === "all-" + groupIdx ? "Processing Payment..." : `Pay Total to ${group.farmerName}`}
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn btn--secondary" onClick={() => window.location.href = '/buyer/orders'}>
              View in My Orders
            </button>
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
          <div className="stack" style={{ gap: '2rem' }}>
            {farmerGroups.map((group, gIdx) => (
              <div key={gIdx} className="stack" style={{ gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', background: 'var(--color-primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Produce from {group.farmerName}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {group.items.map((item) => (
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
            ))}
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
