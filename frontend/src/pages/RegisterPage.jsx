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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

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
    <section className="auth-shell">
      <div className="auth-card">
        <div className="hero-copy">
          <span className="eyebrow">Farmer or buyer onboarding</span>
          <h1>Create a local AgriChain account</h1>
          <p>
            Use a buyer account for INR orders with UPI or COD, or a farmer account to list
            produce with blockchain-backed traceability records.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <Alert type="danger" message={error} />

          <label>
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Asha Patel"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="farmer@local.test"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              minLength={6}
            />
          </label>

          <label>
            <span>Role</span>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
            </select>
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-footnote">
          Already registered? <Link to="/login">Login here</Link>.
        </p>
      </div>
    </section>
  );
}
