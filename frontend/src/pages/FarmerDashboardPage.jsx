import { useEffect, useState } from "react";
import api from "../api/client";
import ProductCard from "../components/ProductCard";
import OrderTimeline from "../components/OrderTimeline";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import {
  extractErrorMessage,
  formatCurrency,
  formatDate,
  formatDateInput,
  formatPaymentMethod,
  shortenHash,
} from "../utils/formatters";

const emptyForm = {
  name: "",
  category: "vegetables",
  quantity: 1,
  unit: "kg",
  priceRupees: "250",
  description: "",
  imageUrl: "",
  originLocation: "",
  harvestDate: "",
  isAvailable: true,
};

export default function FarmerDashboardPage() {
  const [formData, setFormData] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [productResponse, orderResponse] = await Promise.all([
        api.get("/products/my/listings"),
        api.get("/orders"),
      ]);
      setProducts(productResponse.data.products);
      setOrders(orderResponse.data.orders);
      setError("");
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeProducts = products.filter((product) => product.isAvailable).length;
  const openOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
  const farmerEarningsPaise = orders
    .filter((order) => ["paid", "collected"].includes(order.paymentStatus) && order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.totalPaise - order.platformFeePaise), 0);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit,
      priceRupees: (product.pricePaise / 100).toFixed(2),
      description: product.description,
      imageUrl: product.imageUrl,
      originLocation: product.originLocation,
      harvestDate: formatDateInput(product.harvestDate),
      isAvailable: product.isAvailable,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        pricePaise: Math.round(Number(formData.priceRupees) * 100),
      };

      if (payload.pricePaise <= 0) {
        throw new Error("Price must be greater than zero.");
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/products", payload);
        setMessage("Product listed and recorded on the blockchain.");
      }

      resetForm();
      await loadDashboard();
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/products/${product._id}`);
      setMessage("Product removed from the marketplace.");
      await loadDashboard();
    } catch (deleteError) {
      setError(extractErrorMessage(deleteError));
    }
  };

  const handleOrderAction = async (order, nextStatus) => {
    setError("");
    setMessage("");

    try {
      const { data } = await api.put(`/orders/${order._id}/status`, {
        status: nextStatus,
      });
      setMessage(data.message);
      await loadDashboard();
    } catch (actionError) {
      setError(extractErrorMessage(actionError));
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Farmer operations</span>
          <h1>Farmer Dashboard</h1>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={message} />

      {loading ? (
        <Loader label="Loading farmer data..." />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>My Products</span>
              <strong>{products.length}</strong>
            </div>
            <div className="stat-card">
              <span>Active Listings</span>
              <strong>{activeProducts}</strong>
            </div>
            <div className="stat-card">
              <span>Open Orders</span>
              <strong>{openOrders}</strong>
            </div>
            <div className="stat-card">
              <span>Earnings Recorded</span>
              <strong>{formatCurrency(farmerEarningsPaise)}</strong>
            </div>
          </div>

          <div className="split-grid split-grid--wide">
            <form className="card form-grid" onSubmit={handleSubmit}>
              <div className="section-title">
                <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
                {editingProduct && (
                  <button className="btn btn--ghost" type="button" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <label>
                <span>Name</span>
                <input name="name" value={formData.name} onChange={handleInputChange} required />
              </label>

              <label>
                <span>Category</span>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="dairy">Dairy</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <div className="inline-grid">
                <label>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="0"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  <span>Unit</span>
                  <select name="unit" value={formData.unit} onChange={handleInputChange}>
                    <option value="kg">kg</option>
                    <option value="dozen">dozen</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Price in INR</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  name="priceRupees"
                  value={formData.priceRupees}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label>
                <span>Origin Location</span>
                <input
                  name="originLocation"
                  value={formData.originLocation}
                  onChange={handleInputChange}
                  placeholder="Nashik, Maharashtra"
                  required
                />
              </label>

              <label>
                <span>Harvest Date</span>
                <input
                  type="date"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </label>

              <label>
                <span>Image URL</span>
                <input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="Optional image link"
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={Boolean(formData.isAvailable)}
                  onChange={handleInputChange}
                />
                <span>Keep this product available in the marketplace</span>
              </label>

              <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
              </button>
            </form>

            <div className="card stack">
              <div className="section-title">
                <h2>My Products</h2>
              </div>

              {products.length === 0 ? (
                <div className="empty-state">No products listed yet.</div>
              ) : (
                <div className="stack">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      userRole="farmer"
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card stack">
            <div className="section-title">
              <h2>Received Orders</h2>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">No orders received yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-card__header">
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <p className="muted">
                        {order.productId?.name} • Buyer: {order.buyerId?.name}
                      </p>
                    </div>
                    <div className="meta-grid">
                      <span>Qty: {order.quantity}</span>
                      <span>Total: {formatCurrency(order.totalPaise)}</span>
                      <span>Payment: {formatPaymentMethod(order.paymentMethod)}</span>
                      <span>Status: {order.paymentStatus}</span>
                      <span>Placed: {formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <OrderTimeline
                    status={order.status}
                    paymentStatus={order.paymentStatus}
                    paymentMethod={order.paymentMethod}
                  />

                  <div className="list-row">
                    <span>Order Tx</span>
                    <code>{shortenHash(order.blockchainRefs?.orderCreated)}</code>
                  </div>

                  <div className="card__actions">
                    {order.status === "pending" && (
                      <button
                        className="btn btn--primary"
                        onClick={() => handleOrderAction(order, "confirmed")}
                        disabled={order.paymentMethod === "upi" && order.paymentStatus !== "paid"}
                      >
                        Confirm Order
                      </button>
                    )}

                    {order.status === "confirmed" && (
                      <button className="btn btn--secondary" onClick={() => handleOrderAction(order, "shipped")}>
                        Mark Shipped
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
