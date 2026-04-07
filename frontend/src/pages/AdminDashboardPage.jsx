import { useEffect, useState } from "react";
import api from "../api/client";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { extractErrorMessage, formatCurrency, formatDate } from "../utils/formatters";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsResponse, usersResponse, productsResponse, ordersResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/products"),
        api.get("/admin/orders"),
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data.users);
      setProducts(productsResponse.data.products);
      setOrders(ordersResponse.data.orders);
      setError("");
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDisableProduct = async (productId) => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/products/${productId}`);
      setMessage("Product was disabled successfully.");
      await loadAdminData();
    } catch (deleteError) {
      setError(extractErrorMessage(deleteError));
    }
  };

  return (
    <section className="stack" style={{ gap: '3rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="eyebrow">Platform Administration</div>
          <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500', fontSize: '1.1rem' }}>Global oversight of users, products, and supply chain integrity.</p>
        </div>
        <Link to="/admin/analytics" className="btn btn--primary btn--large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          View Live Analytics
        </Link>
      </header>

      {error && <Alert type="danger" message={error} />}
      {message && <Alert type="success" message={message} />}

      {loading ? (
        <Loader label="Synchronizing platform data..." />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M18 7a4 4 0 1 0-4 4 4 4 0 0 0 1-.13"/></svg>
              </div>
              <span>Total Users</span>
              <strong>{stats?.totalUsers || 0}</strong>
              <div className="subtext">Farmers and Buyers</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--color-primary)' }}>
              <div className="icon" style={{ color: 'var(--color-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
              </div>
              <span style={{ color: 'var(--color-primary)' }}>Total Products</span>
              <strong>{stats?.totalProducts || 0}</strong>
              <div className="subtext">Active listings</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--color-info)' }}>
              <div className="icon" style={{ color: 'var(--color-info)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </div>
              <span style={{ color: 'var(--color-info)' }}>Total Orders</span>
              <strong>{stats?.totalOrders || 0}</strong>
              <div className="subtext">Fulfilled and pending</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--color-secondary)' }}>
              <div className="icon" style={{ color: 'var(--color-secondary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span style={{ color: 'var(--color-secondary)' }}>Platform Revenue</span>
              <strong>{formatCurrency(stats?.revenuePaise || 0)}</strong>
              <div className="subtext">Total commission collected</div>
            </div>
          </div>

          <div className="card stack">
            <h2 style={{ fontSize: '1.5rem' }}>Registered Users</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: '700' }}>{user.name}</td>
                      <td style={{ color: 'var(--color-muted)' }}>{user.email}</td>
                      <td>
                        <span className={`badge badge--${user.role === 'farmer' ? 'primary' : 'info'}`} style={{ fontSize: '0.65rem' }}>
                          {user.role}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="stack">
            <h2 style={{ fontSize: '1.5rem' }}>Inventory Oversight</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produce</th>
                    <th>Farmer</th>
                    <th>Batch</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Visibility</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td style={{ fontWeight: '700' }}>{product.name}</td>
                      <td>{product.farmerId?.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{product.batchCode}</td>
                      <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                      <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{formatCurrency(product.pricePaise)}</td>
                      <td>
                        <span style={{ fontWeight: '600' }}>{product.quantity}</span> <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{product.unit}</span>
                      </td>
                      <td>
                        <span className={`badge badge--${product.isAvailable ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem' }}>
                          {product.isAvailable ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {product.isAvailable && (
                          <button
                            className="btn btn--secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--color-danger)' }}
                            onClick={() => handleDisableProduct(product._id)}
                          >
                            Disable
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="stack">
            <h2 style={{ fontSize: '1.5rem' }}>Global Order Ledger</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Buyer</th>
                    <th>Produce</th>
                    <th>Lifecycle</th>
                    <th>Payment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: '800', color: 'var(--color-primary)' }}>{order.orderNumber}</td>
                      <td>{order.buyerId?.name}</td>
                      <td style={{ fontWeight: '600' }}>{order.productId?.name}</td>
                      <td>
                        <span className="badge badge--info" style={{ fontSize: '0.65rem' }}>{order.status}</span>
                      </td>
                      <td>
                        <div className="stack" style={{ gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>{order.paymentMethod}</span>
                          <span className={`badge badge--${order.paymentStatus === 'paid' ? 'success' : 'warning'}`} style={{ fontSize: '0.6rem' }}>{order.paymentStatus}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '800' }}>{formatCurrency(order.totalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );

}
