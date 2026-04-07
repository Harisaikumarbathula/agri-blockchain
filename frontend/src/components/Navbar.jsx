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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(30, 112, 65, 0.2))' }}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
        <Link to="/"><span style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AgriChain</span></Link>
      </div>

      <nav className="navbar__links">
        {isAuthenticated && (
          <NavLink to="/marketplace" className={({ isActive }) => isActive ? 'active' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            Marketplace
          </NavLink>
        )}
        {user?.role === "buyer" && (
          <NavLink to="/buyer/orders" className={({ isActive }) => isActive ? 'active' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            My Orders
          </NavLink>
        )}
        {user?.role === "farmer" && (
          <NavLink to="/farmer/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Dashboard
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="navbar__actions">
        {user?.role === "buyer" && (
          <NavLink to="/cart" style={{ position: 'relative', marginRight: '1rem', padding: '0.6rem', borderRadius: '50%', background: 'var(--color-background)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            {cartCount > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--color-primary)', color: 'white', fontSize: '0.65rem', minWidth: '18px', height: '18px', padding: '0 4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{cartCount}</span>}
          </NavLink>
        )}

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "navbar__profile-link active" : "navbar__profile-link"}>
              <span className="navbar__profile-name">{user?.name}</span>
              <span className="navbar__profile-role">{user?.role}</span>
            </NavLink>
            <button onClick={handleLogout} className="btn btn--ghost" style={{ padding: '0.6rem', borderRadius: '50%' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" style={{ fontWeight: '600', color: 'var(--color-muted)' }}>Login</Link>
            <Link className="btn btn--primary" to="/register">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
