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
    <section className="auth-shell">
      <div className="auth-card">
        <div className="hero-copy">
          <span className="eyebrow">Localhost deployment</span>
          <h1>Login to AgriChain Local</h1>
          <p>
            Buyers use INR with UPI or COD, farmers manage traceable produce lots, and admins
            monitor the platform from one local stack.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <Alert type="danger" message={error} />

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="buyer@local.test"
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
              placeholder="Enter your password"
              required
            />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {loading && <Loader label="Checking your credentials..." />}

        <p className="auth-footnote">
          Need an account? <Link to="/register">Create one here</Link>.
        </p>
        <p className="auth-footnote">
          Default admin login: <strong>admin@agri.local</strong> / <strong>Admin123!</strong>
        </p>
      </div>
    </section>
  );
}
