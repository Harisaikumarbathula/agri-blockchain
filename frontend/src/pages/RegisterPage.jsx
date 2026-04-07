import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Alert from "../components/Alert";
import { extractErrorMessage } from "../utils/formatters";

function getHomeRoute(role) {
  return role === "farmer" ? "/farmer/dashboard" : "/marketplace";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validatePassword = (password) => {
    const rules = [
      { regex: /.{8,}/, message: "at least 8 characters long" },
      { regex: /[A-Z]/, message: "an uppercase letter" },
      { regex: /[a-z]/, message: "a lowercase letter" },
      { regex: /[0-9]/, message: "a number" },
      { regex: /[^A-Za-z0-9]/, message: "a special character" }
    ];

    for (let rule of rules) {
      if (!rule.regex.test(password)) {
        return `Password must contain ${rule.message}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    try {
      const user = await registerUser(formData);
      navigate(getHomeRoute(user.role), { replace: true });
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
    }
  };

  return (
    <section className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '3rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            Create Account
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-text)', letterSpacing: '-0.04em' }}>Join AgriChain</h1>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>Direct, transparent agricultural trade.</p>
        </header>

        <form className="form-grid" onSubmit={handleSubmit}>
          {error && <Alert type="danger" message={error} />}

          <label>
            <span>Full Name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Asha Patel"
              required
            />
          </label>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </label>

            <label>
              <span>Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </label>
          </div>

          <label>
            <span>I am a...</span>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="buyer">Buyer (Shop Produce)</option>
              <option value="farmer">Farmer (Sell Produce)</option>
            </select>
          </label>

          <button className="btn btn--primary btn--large btn--block" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <footer style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '700' }}>Login here</Link>
          </p>
        </footer>
      </div>
    </section>
  );
}
