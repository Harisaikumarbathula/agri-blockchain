import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing-wrapper">
      <div className="landing-hero">
        <div className="landing-hero-overlay"></div>
        <div className="landing-blob landing-blob--1"></div>
        <div className="landing-blob landing-blob--2"></div>
        <div className="landing-hero-content">
          <h1 className="slide-up landing-headline">
            <span className="text-highlight">AgriChain</span> &ndash; Transparent Blockchain-Based Agricultural Marketplace
          </h1>
          <h2 className="landing-caption slide-up-delay" style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1e293b", marginTop: "1rem" }}>
            Empowering Farmers. Ensuring Fair Prices. Eliminating Middlemen.
          </h2>
          <p className="landing-caption slide-up-delay-2" style={{ color: "#475569" }}>
            A revolutionary blockchain-based marketplace connecting farmers directly 
            with buyers. Secure smart contracts, uncompromising transparency, and 
            local focus.
          </p>
          
          <div className="landing-actions slide-up-delay-3">
            <Link to="/register" className="btn btn--primary btn--large">
              Get Started as Farmer
            </Link>
            <Link to="/register" className="btn btn--ghost btn--large" style={{ backgroundColor: "rgba(76,175,80,0.1)", color: "#166534" }}>
              Join as Buyer
            </Link>
            <Link to="/marketplace" className="btn btn--secondary btn--large">
              Explore Marketplace
            </Link>
          </div>
        </div>
      </div>

      <div className="landing-about">
        <div className="about-content">
          <h2>The Problem & Our Solution</h2>
          <div className="about-grid">
            <div className="about-panel problem-panel">
              <h3>The Overlooked Farmer</h3>
              <p>For generations, the agricultural supply chain has been crowded by middlemen. Farmers ultimately bear the physical burden but receive a fraction of the end value, limiting their profits and growth.</p>
            </div>
            <div className="about-panel solution-panel">
              <h3>The Blockchain Bridge</h3>
              <p>We use smart contracts to bridge the gap directly. By enabling transparent, direct selling, farmers earn a 100% fair price for their produce, and buyers know exactly where their food comes from.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Platform Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Direct Marketplace</h3>
            <p>A seamless portal built to connect farmers face-to-face with buyers.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⛓️</div>
            <h3>Blockchain Transparency</h3>
            <p>Every transaction is locked natively on the blockchain, eliminating tampering.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💸</div>
            <h3>Smart Contract Escrow</h3>
            <p>Payments are safely held via smart contracts until order delivery completes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
