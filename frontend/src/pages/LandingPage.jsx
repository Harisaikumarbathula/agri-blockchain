import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LandingPage() {
  const [trackId, setTrackId] = useState("");
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/track/${trackId.trim()}`);
    }
  };

  return (
    <div className="stack" style={{ gap: '6rem', paddingBottom: '6rem' }}>
      <section className="hero" style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', paddingTop: '4rem' }}>
        <div className="eyebrow" style={{ marginBottom: '2rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          Blockchain Verified Produce
        </div>
        
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: '1.05', marginBottom: '1.5rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>
          From the <span style={{ color: 'var(--color-primary)', fontStyle: 'italic', position: 'relative' }}>soil<svg style={{ position: 'absolute', bottom: '-10px', left: '0', width: '100%' }} viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,10 Q50,20 100,10" stroke="var(--color-secondary)" strokeWidth="4" fill="none" /></svg></span> to your table,<br />with total transparency.
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--color-muted)', maxWidth: '650px', margin: '0 auto 3rem', lineHeight: '1.6', fontWeight: '500' }}>
          AgriChain connects farmers directly with buyers. Every harvest is recorded on the blockchain, ensuring fair prices and untampered quality tracking.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginBottom: '4rem' }}>
          <Link to="/marketplace" className="btn btn--primary btn--large">
            Shop Marketplace &rarr;
          </Link>
          <Link to="/register" className="btn btn--secondary btn--large">
            Join as a Farmer
          </Link>
        </div>

        <div className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-hover)', maxWidth: '550px', margin: '0 auto', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '1.25rem', color: 'var(--color-primary)', opacity: '0.7' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <form onSubmit={handleTrack} style={{ flex: 1, display: 'flex' }}>
            <input 
              type="text" 
              placeholder="Enter Order or Batch Number..." 
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.6rem 1rem', fontSize: '1.05rem', outline: 'none', boxShadow: 'none' }}
            />
            <button type="submit" className="btn btn--primary" style={{ padding: '0.75rem 1.75rem' }}>Track</button>
          </form>
        </div>
      </section>

      <section className="features">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.75rem', marginBottom: '1rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>A smarter agricultural supply chain</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.15rem', fontWeight: '500' }}>Built on trust, verified by technology.</p>
        </div>
        
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card stack" style={{ padding: '3rem' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--color-primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            </div>
            <h3 style={{ fontSize: '1.65rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Blockchain Traceability</h3>
            <p style={{ color: 'var(--color-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>Every step of the supply chain—from harvest to delivery—is recorded immutably. Scan to know exactly where your food comes from.</p>
          </div>
          
          <div className="card stack" style={{ padding: '3rem' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9800', marginBottom: '1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="4" height="4" x="2" y="14" rx="1"/><path d="M12 18v-4"/><path d="M18 18v-4"/><rect width="14" height="6" x="6" y="12" rx="2"/><path d="M12 12V4"/><path d="M18 12V6"/><path d="M22 6h-8"/><path d="M16 4h-4"/></svg>
            </div>
            <h3 style={{ fontSize: '1.65rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Direct from Farmers</h3>
            <p style={{ color: 'var(--color-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>Cut out the middlemen. Farmers set their own prices and buyers get fresher produce while supporting local agriculture.</p>
          </div>
          
          <div className="card stack" style={{ padding: '3rem' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2196f3', marginBottom: '1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h3 style={{ fontSize: '1.65rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Secure Payments</h3>
            <p style={{ color: 'var(--color-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>Integrated UPI and safe COD options ensure that funds are handled securely and farmers are paid fairly and quickly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}