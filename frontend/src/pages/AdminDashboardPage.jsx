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
    <section className="stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Platform oversight</span>
          <h1>Admin Dashboard</h1>
        </div>
        <a href="/admin/analytics" className="btn btn--secondary">
          View Delivery Analytics
        </a>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={message} />

      {loading ? (
        <Loader label="Loading admin analytics..." />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Users</span>
              <strong>{stats?.totalUsers || 0}</strong>
            </div>
            <div className="stat-card">
              <span>Total Products</span>
              <strong>{stats?.totalProducts || 0}</strong>
            </div>
            <div className="stat-card">
              <span>Total Orders</span>
              <strong>{stats?.totalOrders || 0}</strong>
            </div>
            <div className="stat-card">
              <span>Platform Revenue</span>
              <strong>{formatCurrency(stats?.revenuePaise || 0)}</strong>
            </div>
          </div>

          <div className="card stack">
            <h2>Registered Users</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="split-grid split-grid--wide">
            <div className="card stack">
              <h2>Marketplace Products</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Farmer</th>
                      <th>Batch</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.farmerId?.name}</td>
                        <td>{product.batchCode}</td>
                        <td>{product.category}</td>
                        <td>{formatCurrency(product.pricePaise)}</td>
                        <td>
                          {product.quantity} {product.unit}
                        </td>
                        <td>{product.isAvailable ? "Active" : "Hidden"}</td>
                        <td>
                          {product.isAvailable && (
                            <button
                              className="btn btn--ghost"
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

            <div className="card stack">
              <h2>Order Ledger</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Buyer</th>
                      <th>Product</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.buyerId?.name}</td>
                        <td>{order.productId?.name}</td>
                        <td>{order.status}</td>
                        <td>{order.paymentMethod} / {order.paymentStatus}</td>
                        <td>{formatCurrency(order.totalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
