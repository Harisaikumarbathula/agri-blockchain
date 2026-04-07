import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link, useLocation } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
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
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("orders");
  const [formData, setFormData] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [productResponse, orderResponse] = await Promise.all([
        api.get("/products/my/listings"),
        api.get("/orders"),
      ]);
      setProducts(productResponse.data.products);
      setOrders(orderResponse.data.orders);
      setError("");
    } catch (loadError) {
      if (!silent) setError(extractErrorMessage(loadError));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const intervalId = setInterval(() => {
      loadDashboard(true);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const activeProducts = products.filter((product) => product.isAvailable).length;
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((current) => ({
          ...current,
          imageUrl: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setActiveTab("products");
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
        setMessage("Product listed on the marketplace.");
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (editId) {
      const existing = products.find((p) => p._id === editId);
      if (existing) {
        handleEditProduct(existing);
      } else {
        (async () => {
          try {
            const { data } = await api.get(`/products/${editId}`);
            if (data?.product) {
              handleEditProduct(data.product);
            }
          } catch {
            /* no-op */
          }
        })();
      }
    }
  }, [location.search, products]);

  const handleOrderAction = async (order, nextStatus) => {
    setError("");
    setMessage("");
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, {
        status: nextStatus,
      });
      toast.success(data.message);
      await loadDashboard();
    } catch (actionError) {
      setError(extractErrorMessage(actionError));
      toast.error(extractErrorMessage(actionError));
    }
  };

  return (
    <section className="stack" style={{ gap: '3rem' }}>
      <header>
        <div className="eyebrow">Farmer Portal</div>
        <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>Farmer Dashboard</h1>
        <p style={{ color: 'var(--color-muted)', fontWeight: '500', fontSize: '1.1rem' }}>Manage your listings, track orders, and monitor your earnings.</p>
      </header>

      {error && <Alert type="danger" message={error} />}
      {message && <Alert type="success" message={message} />}

      {loading ? (
        <Loader label="Gathering your farm insights..." />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span>Total Revenue</span>
              <strong>{formatCurrency(farmerEarningsPaise)}</strong>
              <div className="subtext">Net earnings after fees</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--color-primary)' }}>
              <div className="icon" style={{ color: 'var(--color-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
              </div>
              <span style={{ color: 'var(--color-primary)' }}>Active Listings</span>
              <strong>{activeProducts}</strong>
              <div className="subtext">Currently in marketplace</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--color-warning)' }}>
              <div className="icon" style={{ color: 'var(--color-warning)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <span style={{ color: 'var(--color-warning)' }}>Pending Orders</span>
              <strong>{pendingOrders}</strong>
              <div className="subtext">Awaiting your action</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--color-info)' }}>
              <div className="icon" style={{ color: 'var(--color-info)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M18 7a4 4 0 1 0-4 4 4 4 0 0 0 1-.13"/></svg>
              </div>
              <span style={{ color: 'var(--color-info)' }}>Total Orders</span>
              <strong>{orders.length}</strong>
              <div className="subtext">Lifetime history</div>
            </div>
          </div>

          <div className="tabs" style={{ marginTop: '1rem' }}>
            <button 
              className={`tab ${activeTab === 'orders' ? 'active' : ''}`} 
              onClick={() => setActiveTab('orders')}
            >Manage Orders</button>
            <button 
              className={`tab ${activeTab === 'products' ? 'active' : ''}`} 
              onClick={() => setActiveTab('products')}
            >{editingProduct ? 'Edit Listing' : 'List New Produce'}</button>
            <button 
              className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} 
              onClick={() => setActiveTab('inventory')}
            >Your Inventory</button>
          </div>

          <div className="stack" style={{ gap: '2rem' }}>
            {activeTab === "products" && (
              <div className="card" style={{ padding: '3rem' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '2rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    {editingProduct ? 'Edit Your Produce' : 'List New Harvest'}
                  </h2>
                  <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>
                    {editingProduct 
                      ? 'Update your produce details and availability.' 
                      : 'Provide details about your harvest to list it on the blockchain marketplace.'}
                  </p>
                </header>

                <form className="form-grid" onSubmit={handleSubmit} style={{ gap: '2.5rem' }}>
                  <div className="stack" style={{ gap: '1.5rem' }}>
                    <div className="eyebrow" style={{ width: 'fit-content' }}>Basic Information</div>
                    <div className="split-grid">
                      <label>
                        <span>Produce Name</span>
                        <div style={{ position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Organic Tomatoes"
                            required
                            style={{ paddingLeft: '3rem' }}
                          />
                        </div>
                      </label>
                      <label>
                        <span>Category</span>
                        <div style={{ position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', zIndex: 1, pointerEvents: 'none' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                          <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleInputChange}
                            style={{ paddingLeft: '3rem' }}
                          >
                            <option value="vegetables">Vegetables</option>
                            <option value="fruits">Fruits</option>
                            <option value="grains">Grains</option>
                            <option value="spices">Spices</option>
                            <option value="dairy">Dairy</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </label>
                    </div>

                    <div className="split-grid" style={{ gridTemplateColumns: '1fr 1fr 1.5fr' }}>
                      <label>
                        <span>Quantity</span>
                        <div style={{ position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
                          <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            required
                            style={{ paddingLeft: '3rem' }}
                          />
                        </div>
                      </label>
                      <label>
                        <span>Unit</span>
                        <div style={{ position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', zIndex: 1, pointerEvents: 'none' }}><path d="M7 20V4"/><path d="M3 8h4"/><path d="M3 12h4"/><path d="M3 16h4"/><path d="M11 12h10"/><path d="M11 16h10"/><path d="M11 20h10"/><path d="M11 8h10"/><path d="M11 4h10"/></svg>
                          <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            required
                            style={{ paddingLeft: '3rem' }}
                          >
                            <option value="kg">kg</option>
                            <option value="dozen">Dozen</option>
                            <option value="piece">Piece</option>
                            <option value="liter">Liter</option>
                          </select>
                        </div>
                      </label>
                      <label>
                        <span>Price (INR) per unit</span>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', fontWeight: '800', fontSize: '1.1rem' }}>₹</span>
                          <input
                            type="number"
                            name="priceRupees"
                            step="0.01"
                            value={formData.priceRupees}
                            onChange={handleInputChange}
                            required
                            style={{ paddingLeft: '2.5rem', fontWeight: '800', color: 'var(--color-primary)' }}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="stack" style={{ gap: '1.5rem' }}>
                    <div className="eyebrow" style={{ width: 'fit-content' }}>Origin & Quality</div>
                    <div className="split-grid">
                      <label>
                        <span>Farm Location</span>
                        <div style={{ position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          <input
                            type="text"
                            name="originLocation"
                            value={formData.originLocation}
                            onChange={handleInputChange}
                            placeholder="e.g. Nashik, Maharashtra"
                            required
                            style={{ paddingLeft: '3rem' }}
                          />
                        </div>
                      </label>
                      <label>
                        <span>Harvest Date</span>
                        <div style={{ position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', zIndex: 1, pointerEvents: 'none' }}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                          <input
                            type="date"
                            name="harvestDate"
                            value={formData.harvestDate}
                            onChange={handleInputChange}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            required
                            style={{ paddingLeft: '3rem' }}
                          />
                        </div>
                      </label>
                    </div>

                    <label>
                      <span>Description</span>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell buyers about your produce, farming methods, etc."
                        rows="4"
                      ></textarea>
                    </label>
                  </div>

                  <div className="stack" style={{ gap: '1.5rem' }}>
                    <div className="eyebrow" style={{ width: 'fit-content' }}>Media & Visibility</div>
                    <div className="split-grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
                      <label style={{ cursor: 'pointer' }}>
                        <span>Produce Image</span>
                        <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-border)', textAlign: 'center', transition: 'var(--transition)' }}>
                          {formData.imageUrl ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={formData.imageUrl} alt="Preview" style={{ maxHeight: '240px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }} />
                              <button 
                                type="button" 
                                className="btn btn--ghost" 
                                style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'white', padding: '0.4rem', borderRadius: '50%', boxShadow: 'var(--shadow-soft)' }}
                                onClick={(e) => { e.preventDefault(); setFormData(c => ({...c, imageUrl: ""})); }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                              </button>
                            </div>
                          ) : (
                            <div className="stack" style={{ alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                              <div style={{ width: '64px', height: '64px', background: 'var(--color-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                              </div>
                              <div className="stack" style={{ gap: '0.25rem' }}>
                                <p style={{ fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>Upload a photo</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', margin: 0 }}>PNG, JPG or WEBP up to 5MB</p>
                              </div>
                            </div>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </div>
                      </label>
                      
                      <div className="card" style={{ background: 'var(--color-background)', borderStyle: 'dashed', height: '100%', display: 'flex', alignItems: 'center' }}>
                        <label style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', cursor: 'pointer', width: '100%' }}>
                          <div style={{ position: 'relative', width: '48px', height: '24px' }}>
                            <input
                              type="checkbox"
                              name="isAvailable"
                              checked={formData.isAvailable}
                              onChange={handleInputChange}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{ 
                              position: 'absolute', 
                              top: 0, left: 0, right: 0, bottom: 0, 
                              background: formData.isAvailable ? 'var(--color-primary)' : 'var(--color-muted)',
                              borderRadius: '24px',
                              transition: '0.4s'
                            }}></span>
                            <span style={{ 
                              position: 'absolute', 
                              height: '18px', width: '18px', 
                              left: formData.isAvailable ? '26px' : '3px', 
                              bottom: '3px', 
                              background: 'white', 
                              borderRadius: '50%',
                              transition: '0.4s'
                            }}></span>
                          </div>
                          <div className="stack" style={{ gap: '0.1rem' }}>
                            <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>Public Listing</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Show in marketplace</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                    <button className="btn btn--primary btn--large" type="submit" disabled={submitting} style={{ flex: 1, padding: '1.25rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                      {submitting ? "Processing..." : editingProduct ? "Update Listing" : "List on Marketplace"}
                    </button>
                    {editingProduct && (
                      <button className="btn btn--secondary btn--large" type="button" onClick={resetForm} style={{ flex: 0.4 }}>Cancel Edit</button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="stack">
                <h2 style={{ fontSize: '1.5rem' }}>Incoming Orders</h2>
                {orders.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed', background: 'var(--color-background)' }}>
                    <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>No orders have been placed yet.</p>
                  </div>
                ) : (
                  <div className="stack">
                    {orders.map((order) => (
                      <div key={order._id} className="card stack" style={{ gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="stack" style={{ gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-primary)' }}>{order.orderNumber}</span>
                              <span className="badge badge--info">{formatPaymentMethod(order.paymentMethod)}</span>
                              <span className={`badge badge--${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{order.paymentStatus}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600' }}>Ordered on {formatDate(order.createdAt)}</span>
                          </div>
                          <div className="stack" style={{ alignItems: 'flex-end', gap: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text)' }}>{formatCurrency(order.totalPaise)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '600' }}>Platform Fee: {formatCurrency(order.platformFeePaise)}</span>
                          </div>
                        </div>

                        <div className="card" style={{ background: 'var(--color-background)', padding: '1rem' }}>
                          <div className="meta-grid">
                            <div className="stack" style={{ gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Buyer</span>
                              <span style={{ fontWeight: '700' }}>{order.buyerId?.name}</span>
                            </div>
                            <div className="stack" style={{ gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Produce</span>
                              <span style={{ fontWeight: '700' }}>{order.productId?.name} ({order.quantity} {order.productId?.unit})</span>
                            </div>
                            <div className="stack" style={{ gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Order Status</span>
                              <span className="badge badge--info" style={{ width: 'fit-content' }}>{order.status}</span>
                            </div>
                            <div className="stack" style={{ gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Payment Status</span>
                              <span className={`badge badge--${order.paymentStatus === 'paid' ? 'success' : 'warning'}`} style={{ width: 'fit-content' }}>{order.paymentStatus.toUpperCase()}</span>
                            </div>
                            <div className="stack" style={{ gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Proof Hash</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {shortenHash(order.blockchainRefs?.statusUpdated?.[order.status] || order.blockchainRefs?.orderCreated)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <OrderTimeline order={order} />

                        <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                          {order.status === "pending" && (
                            <button className="btn btn--primary" onClick={() => handleOrderAction(order, "confirmed")}>Confirm Order</button>
                          )}
                          {order.status === "confirmed" && (
                            <button className="btn btn--primary" onClick={() => handleOrderAction(order, "shipped")}>Mark as Shipped</button>
                          )}
                          {order.status === "shipped" && (
                            <button className="btn btn--primary" onClick={() => handleOrderAction(order, "out_for_delivery")}>Mark as Out for Delivery</button>
                          )}
                          <Link to={`/track/${order.orderNumber}`} className="btn btn--secondary">Track Journey</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="stack">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.5rem' }}>Your Produce Listings</h2>
                  <button className="btn btn--primary" onClick={() => setActiveTab('products')}>Add New Produce</button>
                </div>
                {products.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed', background: 'var(--color-background)' }}>
                    <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>You haven't listed any produce yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        userRole="farmer"
                        currentUserId={user?.id}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
