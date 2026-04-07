import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { extractErrorMessage } from "../utils/formatters";

function getHomeRoute(role) {
  if (role === "farmer") {
    return "/farmer/dashboard";
  }

  if (role === "admin") {
    return "/admin";
  }

  return "/marketplace";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const user = await loginUser(formData);
      const nextPath = location.state?.from?.pathname || getHomeRoute(user.role);
      navigate(nextPath, { replace: true });
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
    }
  };

  return (
    <section className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '3rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            AgriChain
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-text)', letterSpacing: '-0.04em' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>Log in to manage your orders and produce.</p>
        </header>

        <form className="form-grid" onSubmit={handleSubmit}>
          {error && <Alert type="danger" message={error} />}

          <label>
            <span>Email Address</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </label>

          <label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '700' }}>Forgot password?</Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>

          <button className="btn btn--primary btn--large btn--block" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? "Signing in..." : "Login to Account"}
          </button>
        </form>

        {loading && <Loader label="Verifying credentials..." />}

        <footer style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '700' }}>Sign up for free</Link>
          </p>
        </footer>
      </div>
    </section>
  );
}
