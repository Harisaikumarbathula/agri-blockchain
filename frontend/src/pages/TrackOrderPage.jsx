import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import DeliveryMap from "../components/DeliveryMap";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import {
  extractErrorMessage,
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  shortenHash,
} from "../utils/formatters";

function formatContactNumber(contact) {
  return [contact?.phoneExtension, contact?.phone].filter(Boolean).join(" ") || "Not available";
}

function formatAddress(address) {
  const location = [address?.place, address?.state, address?.country].filter(Boolean).join(", ");
  return [location, address?.pincode].filter(Boolean).join(" - ") || "Not available";
}

export default function TrackOrderPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(orderNumber || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderNumber);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const loadOrder = async (silent = false) => {
      if (!order && !silent) setLoading(true);
      try {
        const { data } = await api.get(`/track/${orderNumber}`);
        setOrder(data.order);
        setError("");
      } catch (loadError) {
        if (!silent) setError(extractErrorMessage(loadError));
        if (!silent) setOrder(null);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    loadOrder();

    const intervalId = setInterval(() => {
      loadOrder(true);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [orderNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${searchInput.trim()}`);
    }
  };

  const timelineSteps = [];
  if (order) {
    if (order.blockchainRefs?.orderCreated) {
      timelineSteps.push({
        title: "ORDER PLACED",
        date: order.createdAt,
        hash: order.blockchainRefs.orderCreated,
        details: [
          { label: "Batch Code", value: order.product?.batchCode },
          { label: "Origin", value: order.product?.originLocation },
          { label: "Harvest Date", value: formatDate(order.product?.harvestDate).split(",")[0] },
          { label: "Quantity", value: `${order.quantity} ${order.product?.unit}` },
          { label: "Buyer Address", value: formatAddress(order.buyerContact?.address) },
          { label: "Buyer Mobile", value: formatContactNumber(order.buyerContact) }
        ]
      });
    }
    
    if (order.blockchainRefs?.paymentRecorded) {
      const paymentHistory = order.paymentHistory?.find(h => h.status === 'paid') || { changedAt: order.updatedAt };
      timelineSteps.push({
        title: "PAYMENT CONFIRMED",
        date: paymentHistory.changedAt,
        hash: order.blockchainRefs.paymentRecorded,
        details: [
          { label: "Method", value: formatPaymentMethod(order.paymentMethod).toUpperCase() },
          { label: "Total Paid", value: formatCurrency(order.totalPaise) }
        ]
      });
    }

    if (order.blockchainRefs?.statusUpdated?.confirmed) {
      const history = order.statusHistory?.find(h => h.status === 'confirmed') || { changedAt: order.updatedAt };
      timelineSteps.push({
        title: "ORDER CONFIRMED",
        date: history.changedAt,
        hash: order.blockchainRefs.statusUpdated.confirmed,
        details: [
          { label: "Confirmed By", value: order.farmer?.name }
        ]
      });
    }

    if (order.blockchainRefs?.statusUpdated?.shipped) {
      const history = order.statusHistory?.find(h => h.status === 'shipped') || { changedAt: order.updatedAt };
      timelineSteps.push({
        title: "ORDER SHIPPED",
        date: history.changedAt,
        hash: order.blockchainRefs.statusUpdated.shipped,
        details: [
          { label: "Shipped By", value: order.farmer?.name || "Verified Farmer" }
        ]
      });
    }

    const outForDeliveryHistory = order.statusHistory?.find(h => h.status === 'out_for_delivery');
    if (outForDeliveryHistory) {
      timelineSteps.push({
        title: "OUT FOR DELIVERY",
        date: outForDeliveryHistory.changedAt,
        hash: order.blockchainRefs?.statusUpdated?.out_for_delivery || "", 
        details: [
          { label: "Location", value: order.location ? `${order.location.lat.toFixed(4)}, ${order.location.lng.toFixed(4)}` : "In Transit" }
        ]
      });
    }

    if (order.blockchainRefs?.statusUpdated?.delivered) {
      const history = order.statusHistory?.find(h => h.status === 'delivered') || { changedAt: order.updatedAt };
      timelineSteps.push({
        title: "ORDER DELIVERED",
        date: history.changedAt,
        hash: order.blockchainRefs.statusUpdated.delivered,
        details: [
          { label: "Received By", value: order.buyer?.name }
        ]
      });
    }
  }

  return (
    <section className="stack" style={{ gap: '3rem' }}>
      <header style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          Blockchain Traceability
        </div>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--color-text)', marginBottom: '1rem', letterSpacing: '-0.04em' }}>Track Journey</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.2rem', fontWeight: '500', lineHeight: '1.6' }}>Verify the immutable journey of your produce from the farm directly to your table.</p>
      </header>

      <div className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-hover)', maxWidth: '600px', margin: '0 auto', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', width: '100%' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '1.25rem', color: 'var(--color-primary)', opacity: '0.7' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex' }}>
          <input 
            type="text" 
            placeholder="Enter Order Number (e.g. AGR...)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.6rem 1rem', fontSize: '1.1rem', outline: 'none', boxShadow: 'none' }}
          />
          <button type="submit" className="btn btn--primary" style={{ padding: '0.75rem 2rem' }}>Track</button>
        </form>
      </div>

      {loading && <Loader label="Decrypting blockchain proofs..." />}
      {error && !loading && <Alert type="danger" message={error} />}

      {order && !loading && (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {order.status === "out_for_delivery" && order.location && (
             <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
               <DeliveryMap location={order.location} orderNumber={order.orderNumber} />
             </div>
          )}

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ borderLeft: '6px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--color-primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                Verified Product details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="stack" style={{ gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produce</span>
                    <span style={{ fontWeight: '900', fontSize: '1.6rem', color: 'var(--color-text)', fontFamily: 'Fraunces, serif', textTransform: 'uppercase' }}>{order.product?.name}</span>
                  </div>
                  <div className="stack" style={{ gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</span>
                    <span style={{ fontWeight: '800', fontSize: '1.6rem', color: 'var(--color-text)' }}>{order.quantity} <span style={{ fontSize: '1rem', color: 'var(--color-muted)', fontWeight: '600' }}>{order.product?.unit}</span></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '80px' }}>Farmer</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.farmer?.name || "Verified Farmer"}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ background: 'var(--color-primary-light)', borderRadius: '50%', padding: '2px', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '80px' }}>Buyer</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.buyer?.name || "Verified Buyer"}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ background: 'var(--color-primary-light)', borderRadius: '50%', padding: '2px', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ borderLeft: '6px solid var(--color-info)', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-info)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                Secure tracking status
              </div>
              <div className="stack" style={{ gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--color-primary)', fontWeight: '800', fontSize: '1.15rem' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 0 4px var(--color-primary-light)' }}></div>
                  Trust verified on network
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="stack" style={{ gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Proofs</span>
                    <span style={{ fontWeight: '800', fontSize: '1.6rem', color: 'var(--color-text)' }}>{timelineSteps.length} <span style={{ fontSize: '1.1rem', color: 'var(--color-muted)', fontWeight: '600' }}>Steps</span></span>
                  </div>
                  <div className="stack" style={{ gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span style={{ fontWeight: '900', fontSize: '1.6rem', color: 'var(--color-primary)' }}>Fully</span>
                      <span style={{ fontWeight: '600', fontSize: '1.2rem', color: 'var(--color-primary)', opacity: 0.8 }}>Verified</span>
                    </div>
                  </div>
                </div>

                <div className="stack" style={{ gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blockchain Address</span>
                    <button 
                      className="btn btn--ghost" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', minWidth: 'auto', textDecoration: 'underline', color: 'var(--color-text)', fontWeight: '700' }}
                      onClick={(e) => {
                        const target = e.currentTarget.parentElement.nextElementSibling;
                        target.style.display = target.style.display === 'none' ? 'block' : 'none';
                        e.currentTarget.textContent = target.style.display === 'none' ? 'Show Details' : 'Hide Details';
                      }}
                    >
                      Show Details
                    </button>
                  </div>
                  <div style={{ display: 'none', color: 'var(--color-muted)', fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all', background: 'var(--color-background)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ borderLeft: '6px solid var(--color-secondary)', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#a06c00', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(244, 179, 36, 0.14)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a06c00' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                </div>
                Farm Details
              </div>

              <div className="stack" style={{ gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Farmer</span>
                  <div style={{ marginTop: '0.3rem', fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-text)' }}>{order.farmerContact?.name || order.farmer?.name || "Verified Farmer"}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Farm Address</span>
                  <div style={{ marginTop: '0.3rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.6' }}>
                    {formatAddress(order.farmerContact?.address) !== "Not available" ? formatAddress(order.farmerContact?.address) : order.product?.originLocation || "Not available"}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</span>
                    <div style={{ marginTop: '0.3rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.6' }}>{formatContactNumber(order.farmerContact)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                    <div style={{ marginTop: '0.3rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.6', overflowWrap: 'anywhere' }}>{order.farmerContact?.email || "Not available"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ borderLeft: '6px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--color-primary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--color-primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92V19a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h2.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.61 2.63a2 2 0 0 1-.45 2.11L7.1 8.91a16 16 0 0 0 8 8l1.45-1.26a2 2 0 0 1 2.11-.45c.85.28 1.73.49 2.63.61A2 2 0 0 1 22 16.92Z"/></svg>
                </div>
                Buyer Delivery Details
              </div>

              <div className="stack" style={{ gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buyer</span>
                  <div style={{ marginTop: '0.3rem', fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-text)' }}>{order.buyerContact?.name || order.buyer?.name || "Verified Buyer"}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Address</span>
                  <div style={{ marginTop: '0.3rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.6' }}>{formatAddress(order.buyerContact?.address)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</span>
                    <div style={{ marginTop: '0.3rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.6' }}>{formatContactNumber(order.buyerContact)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                    <div style={{ marginTop: '0.3rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.6', overflowWrap: 'anywhere' }}>{order.buyerContact?.email || "Not available"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div className="v-timeline">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="v-timeline__step v-timeline__step--done" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="v-timeline__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <div className="v-timeline__content">
                    <div className="v-timeline__header">
                      <div className="v-timeline__title">{step.title}</div>
                      <div className="v-timeline__date">{formatDate(step.date)}</div>
                    </div>
                    <div className="v-timeline__details">
                      {step.details.map((detail, dIdx) => (
                        <div key={dIdx} className="stack" style={{ gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{detail.label}</span>
                          <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>{detail.value}</span>
                        </div>
                      ))}
                    </div>
                    {step.hash && (
                      <div className="v-timeline__hash">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Blockchain Proof</span>
                            <button 
                              className="btn btn--ghost" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto', textDecoration: 'underline' }}
                              onClick={(e) => {
                                const target = e.currentTarget.parentElement.nextElementSibling;
                                target.style.display = target.style.display === 'none' ? 'block' : 'none';
                                e.currentTarget.textContent = target.style.display === 'none' ? 'View Hash' : 'Hide Hash';
                              }}
                            >
                              View Hash
                            </button>
                          </div>
                          <div style={{ display: 'none', color: 'var(--color-muted)', marginTop: '0.75rem', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            {step.hash}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
