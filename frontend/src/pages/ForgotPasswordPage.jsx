import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Simulate API call for forgot password since no backend endpoint currently exists
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMessage("If an account exists with this email, you will receive password reset instructions.");
      setEmail("");
    } catch (submitError) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card" style={{ padding: '2.5rem', borderRadius: '24px', maxWidth: '480px', width: '100%', margin: '0 auto', background: 'white', boxShadow: 'var(--shadow-card)' }}>
        <div className="hero-copy" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Account Recovery
          </div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>Forgot Password?</h1>
          <p className="muted" style={{ fontSize: '1.05rem' }}>Enter your email and we'll send you reset instructions.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <Alert type="danger" message={error} />
          <Alert type="success" message={message} />

          <label>
            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Email Address</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@local.test"
              required
              style={{ padding: '0.85rem 1rem' }}
            />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={loading} style={{ marginTop: '1.5rem', padding: '0.9rem', fontSize: '1.05rem', borderRadius: '12px' }}>
            {loading ? "Sending..." : "Reset Password"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p className="auth-footnote" style={{ fontSize: '1rem' }}>
            Remember your password? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Back to login</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}