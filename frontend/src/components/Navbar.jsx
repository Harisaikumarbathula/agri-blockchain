import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { cartCount } = useCart();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link to="/">AgriChain Local</Link>
        <span className="navbar__tag">Farm-to-buyer transparency</span>
      </div>

      <nav className="navbar__links">
        {isAuthenticated && <NavLink end to="/">Home</NavLink>}
        {isAuthenticated && <NavLink to="/marketplace">Marketplace</NavLink>}

        {user?.role === "buyer" && <NavLink to="/cart">Cart ({cartCount})</NavLink>}
        {user?.role === "buyer" && <NavLink to="/buyer/orders">Buyer Orders</NavLink>}
        {user?.role === "farmer" && <NavLink to="/farmer/dashboard">Farmer Dashboard</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin">Admin Dashboard</NavLink>}
      </nav>

      <div className="navbar__actions">
        <span className="wallet-chip">Blockchain Proofs Enabled</span>

        {isAuthenticated ? (
          <>
            <span className="user-chip">
              {user?.name} ({user?.role})
            </span>
            <button className="btn btn--ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn--ghost" to="/login">
              Login
            </Link>
            <Link className="btn btn--primary" to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
