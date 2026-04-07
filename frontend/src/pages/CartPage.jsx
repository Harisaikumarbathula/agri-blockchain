import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { extractErrorMessage, formatCurrency } from "../utils/formatters";
import {
  getRazorpayErrorMessage,
  isRazorpayDismissed,
  payOrderWithRazorpay,
} from "../utils/razorpay";

function createCheckoutForm(user) {
  return {
    email: user?.email || "",
    phoneExtension: user?.phoneExtension || "+91",
    phone: user?.phone || "",
    place: user?.address?.place || user?.address?.village || user?.address?.district || "",
    state: user?.address?.state || "",
    country: user?.address?.country || "",
    pincode: user?.address?.pincode || "",
  };
}

function buildCheckoutAddress(formData) {
  const location = [formData.place, formData.state, formData.country].filter(Boolean).join(", ");
  return [location, formData.pincode].filter(Boolean).join(" - ");
}

function getPaymentBadgeClass(status) {
  return status === "paid" ? "badge badge--success" : "badge badge--warning";
}

function replaceCheckoutOrder(groups, groupIdx, updatedOrder) {
  return groups.map((group, currentIndex) =>
    currentIndex === groupIdx
      ? {
          ...group,
          orders: group.orders.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)),
        }
      : group
  );
}

export default function CartPage() {
  const contactSectionRef = useRef(null);
  const checkoutFieldRefs = useRef({});
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [placingOrders, setPlacingOrders] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutGroups, setCheckoutGroups] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState(() => createCheckoutForm(user));

  useEffect(() => {
    setCheckoutForm(createCheckoutForm(user));
  }, [user]);

  const groupedItems = items.reduce((acc, item) => {
    const farmerId = item.product.farmerId?._id || item.product.farmerId;
    const farmerName = item.product.farmerId?.name || "Verified Farmer";

    if (!acc[farmerId]) {
      acc[farmerId] = {
        farmerId,
        farmerName,
        items: [],
        total: 0,
      };
    }

    acc[farmerId].items.push(item);
    acc[farmerId].total += item.product.pricePaise * item.quantity;
    return acc;
  }, {});

  const farmerGroups = Object.values(groupedItems);
  const cartTotal = items.reduce((sum, item) => sum + item.product.pricePaise * item.quantity, 0);
  const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const handleCheckoutFieldChange = (event) => {
    const { name, value } = event.target;
    setCheckoutForm((current) => ({ ...current, [name]: value }));
    if (error) {
      setError("");
    }
  };

  const focusCheckoutField = (fieldName) => {
    contactSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      checkoutFieldRefs.current[fieldName]?.focus();
    }, 120);
  };

  const handleCheckout = async () => {
    const buyerContact = {
      email: checkoutForm.email.trim(),
      phoneExtension: checkoutForm.phoneExtension.trim(),
      phone: checkoutForm.phone.trim(),
      address: {
        place: checkoutForm.place.trim(),
        state: checkoutForm.state.trim(),
        country: checkoutForm.country.trim(),
        pincode: checkoutForm.pincode.trim(),
      },
    };

    const missingFields = [];
    if (!buyerContact.email) missingFields.push({ label: "Email", field: "email" });
    if (!buyerContact.phoneExtension) missingFields.push({ label: "Mobile Extension", field: "phoneExtension" });
    if (!buyerContact.phone) missingFields.push({ label: "Mobile Number", field: "phone" });
    if (!buyerContact.address.place) missingFields.push({ label: "Address / Place", field: "place" });
    if (!buyerContact.address.state) missingFields.push({ label: "State", field: "state" });
    if (!buyerContact.address.country) missingFields.push({ label: "Country", field: "country" });
    if (!buyerContact.address.pincode) missingFields.push({ label: "Pincode", field: "pincode" });

    if (missingFields.length > 0) {
      setError(`Complete the required delivery details before placing the order: ${missingFields.map((item) => item.label).join(", ")}.`);
      setMessage("");
      focusCheckoutField(missingFields[0].field);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(buyerContact.email)) {
      setError("Please enter a valid email address.");
      setMessage("");
      focusCheckoutField("email");
      return;
    }

    if (!/^\+?[0-9]{1,4}$/.test(buyerContact.phoneExtension)) {
      setError("Please enter a valid mobile extension.");
      setMessage("");
      focusCheckoutField("phoneExtension");
      return;
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(buyerContact.phone)) {
      setError("Please enter a valid mobile number.");
      setMessage("");
      focusCheckoutField("phone");
      return;
    }

    if (!/^[0-9]{4,10}$/.test(buyerContact.address.pincode)) {
      setError("Please enter a valid pincode.");
      setMessage("");
      focusCheckoutField("pincode");
      return;
    }

    setPlacingOrders(true);
    setError("");
    setMessage("");
    const completedProductIds = [];
    const createdGroups = [];

    try {
      for (const group of farmerGroups) {
        const groupOrders = [];

        for (const item of group.items) {
          const { data } = await api.post("/orders", {
            productId: item.product._id,
            quantity: Number(item.quantity),
            paymentMethod,
            buyerContact,
          });

          completedProductIds.push(item.product._id);
          groupOrders.push(data.order);
        }

        createdGroups.push({
          farmerName: group.farmerName,
          orders: groupOrders,
          total: groupOrders.reduce((sum, order) => sum + order.totalPaise, 0),
        });
      }

      completedProductIds.forEach((id) => removeFromCart(id));
      setCheckoutGroups(createdGroups);
      setMessage(
        paymentMethod === "upi"
          ? "Orders created. Complete each online payment with Razorpay Test Mode below."
          : "COD orders created successfully."
      );
    } catch (checkoutError) {
      completedProductIds.forEach((id) => removeFromCart(id));
      setError(extractErrorMessage(checkoutError));
    } finally {
      setPlacingOrders(false);
    }
  };

  const handlePayOrder = async (orderId, groupIdx) => {
    const order = checkoutGroups[groupIdx]?.orders.find((currentOrder) => currentOrder._id === orderId);
    if (!order) {
      return;
    }

    setBusyOrderId(orderId);
    setError("");
    setMessage("");

    try {
      const data = await payOrderWithRazorpay(order);
      setCheckoutGroups((current) => replaceCheckoutOrder(current, groupIdx, data.order));
      setMessage(data.message);
    } catch (paymentError) {
      const feedback = getRazorpayErrorMessage(paymentError);

      if (isRazorpayDismissed(paymentError)) {
        setMessage(feedback);
      } else {
        setError(feedback);
      }
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <section className="stack" style={{ gap: "2rem" }}>
      <div className="card cart-hero">
        <div className="cart-hero__copy">
          <div className="eyebrow">Checkout Desk</div>
          <h1>Your Shopping Cart</h1>
          <p>Review grouped produce, confirm delivery details, and place a verified order with a cleaner checkout flow.</p>
        </div>

        <div className="cart-hero__stats">
          <div className="cart-stat-card">
            <span>Items</span>
            <strong>{items.length}</strong>
            <small>{totalUnits} total units selected</small>
          </div>
          <div className="cart-stat-card">
            <span>Farmers</span>
            <strong>{farmerGroups.length}</strong>
            <small>Grouped for streamlined billing</small>
          </div>
          <div className="cart-stat-card">
            <span>Cart Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
            <small>Delivery fee stays free</small>
          </div>
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}
      {message && <Alert type="success" message={message} />}
      {placingOrders && <Loader label="Securing your order on the blockchain..." />}

      {checkoutGroups.length > 0 && (
        <div className="stack" style={{ gap: "1.5rem" }}>
          <div className="card cart-success-banner">
            <div>
              <div className="eyebrow" style={{ marginBottom: "0.5rem" }}>Orders Created</div>
              <h2>Checkout complete</h2>
              <p>Your farmer-wise orders are secured. If you chose online payment, finish each one with Razorpay Test Mode from the invoice cards below.</p>
            </div>
            <Link className="btn btn--secondary" to="/buyer/orders">Open My Orders</Link>
          </div>

          {checkoutGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="card cart-invoice-card">
              <div className="cart-invoice-card__head">
                <div>
                  <span className="cart-section-label">Farmer Invoice</span>
                  <h3>{group.farmerName}</h3>
                </div>
                <div className="cart-invoice-card__summary">
                  <span>{group.orders.length} secured</span>
                  <strong>{formatCurrency(group.total)}</strong>
                </div>
              </div>

              <div className="cart-invoice-list">
                {group.orders.map((order) => (
                  <div
                    key={order._id}
                    className={`cart-invoice-row ${
                      order.paymentMethod === "upi" && order.paymentStatus !== "paid"
                        ? "cart-invoice-row--with-action"
                        : ""
                    }`}
                  >
                    <div>
                      <strong>{order.productId?.name}</strong>
                      <span>{order.orderNumber}</span>
                    </div>
                    <div>{order.quantity} {order.productId?.unit}</div>
                    <div>{formatCurrency(order.totalPaise)}</div>
                    <div>
                      <span className={getPaymentBadgeClass(order.paymentStatus)}>{order.paymentStatus.toUpperCase()}</span>
                    </div>
                    {order.paymentMethod === "upi" && order.paymentStatus !== "paid" && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn--primary"
                          disabled={busyOrderId === order._id}
                          onClick={() => handlePayOrder(order._id, groupIdx)}
                          style={{ width: "100%" }}
                        >
                          {busyOrderId === order._id
                            ? "Opening Checkout..."
                            : order.paymentStatus === "failed"
                              ? "Retry Payment"
                              : "Pay with Razorpay"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && checkoutGroups.length === 0 ? (
        <div className="empty-state">
          <h2 style={{ marginBottom: "0.5rem" }}>Your cart is empty</h2>
          <p style={{ marginBottom: "1.5rem" }}>Looks like you have not added any fresh produce yet.</p>
          <Link className="btn btn--primary btn--large" to="/marketplace">Browse Marketplace</Link>
        </div>
      ) : items.length > 0 ? (
        <>
          <div ref={contactSectionRef} className="card cart-contact-card">
            <div className="cart-contact-card__head">
              <div>
                <div className="eyebrow" style={{ marginBottom: "0.5rem" }}>Required Contact</div>
                <h2>Delivery Details</h2>
                <p>Add the buyer contact details once. We'll carry them through checkout and into tracking.</p>
              </div>

              <div className="cart-contact-preview">
                <span>Delivery Preview</span>
                <strong>{buildCheckoutAddress(checkoutForm) || "Add your delivery address"}</strong>
                <small>{checkoutForm.email || "Add email"} | {[checkoutForm.phoneExtension, checkoutForm.phone].filter(Boolean).join(" ") || "Add mobile number"}</small>
              </div>
            </div>

            <div className="cart-contact-grid">
              <label>
                <span>Email</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.email = element;
                  }}
                  type="email"
                  name="email"
                  value={checkoutForm.email}
                  onChange={handleCheckoutFieldChange}
                  placeholder="name@example.com"
                />
              </label>
              <label>
                <span>Mobile Extension</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.phoneExtension = element;
                  }}
                  type="tel"
                  name="phoneExtension"
                  value={checkoutForm.phoneExtension}
                  onChange={handleCheckoutFieldChange}
                  placeholder="+91"
                />
              </label>
              <label>
                <span>Mobile Number</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.phone = element;
                  }}
                  type="tel"
                  name="phone"
                  value={checkoutForm.phone}
                  onChange={handleCheckoutFieldChange}
                  placeholder="98765 43210"
                />
              </label>
              <label>
                <span>Pincode</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.pincode = element;
                  }}
                  type="text"
                  name="pincode"
                  value={checkoutForm.pincode}
                  onChange={handleCheckoutFieldChange}
                  placeholder="500001"
                />
              </label>
              <label className="cart-contact-grid__wide">
                <span>Address / Place</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.place = element;
                  }}
                  type="text"
                  name="place"
                  value={checkoutForm.place}
                  onChange={handleCheckoutFieldChange}
                  placeholder="House / street / area / place"
                />
              </label>
              <label>
                <span>State</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.state = element;
                  }}
                  type="text"
                  name="state"
                  value={checkoutForm.state}
                  onChange={handleCheckoutFieldChange}
                  placeholder="Telangana"
                />
              </label>
              <label>
                <span>Country</span>
                <input
                  ref={(element) => {
                    checkoutFieldRefs.current.country = element;
                  }}
                  type="text"
                  name="country"
                  value={checkoutForm.country}
                  onChange={handleCheckoutFieldChange}
                  placeholder="India"
                />
              </label>
            </div>
          </div>

          <div className="cart-layout">
            <div className="cart-items-panel">
              {farmerGroups.map((group, groupIndex) => (
                <section key={groupIndex} className="card cart-group-card">
                  <div className="cart-group-card__head">
                    <div>
                      <span className="cart-section-label">Farmer Group</span>
                      <h3>{group.farmerName}</h3>
                    </div>
                    <div className="cart-group-card__total">
                      <span>{group.items.length} product{group.items.length === 1 ? "" : "s"}</span>
                      <strong>{formatCurrency(group.total)}</strong>
                    </div>
                  </div>

                  <div className="cart-group-card__items">
                    {group.items.map((item) => (
                      <article key={item.product._id} className="cart-item-card">
                        <div className="cart-item-card__media">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} />
                          ) : (
                            <div className="cart-item-card__placeholder">
                              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></svg>
                            </div>
                          )}
                        </div>

                        <div className="cart-item-card__content">
                          <div className="cart-item-card__main">
                            <h4>{item.product.name}</h4>
                            <p>{formatCurrency(item.product.pricePaise)} / {item.product.unit}</p>
                            <div className="cart-item-card__meta">
                              <span className="badge badge--info">{item.product.unit}</span>
                              {item.product.originLocation && <span className="badge badge--success">{item.product.originLocation}</span>}
                            </div>
                          </div>

                          <div className="cart-item-card__aside">
                            <div className="cart-item-card__subtotal">
                              <span>Line total</span>
                              <strong>{formatCurrency(item.product.pricePaise * item.quantity)}</strong>
                            </div>

                            <div className="cart-item-card__controls">
                              <div className="cart-qty-stepper">
                                <button type="button" onClick={() => updateQuantity(item.product._id, Number(item.quantity) - 1)}>-</button>
                                <span>{item.quantity}</span>
                                <button type="button" onClick={() => updateQuantity(item.product._id, Number(item.quantity) + 1)}>+</button>
                              </div>

                              <button type="button" className="cart-remove-button" onClick={() => removeFromCart(item.product._id)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <aside className="cart-summary-panel">
              <div className="card cart-summary-card">
                <div className="cart-summary-card__contact">
                  <span className="cart-section-label">Mandatory Contact</span>
                  <strong>{checkoutForm.email || "Add email"}</strong>
                  <p>{[checkoutForm.phoneExtension, checkoutForm.phone].filter(Boolean).join(" ") || "Add mobile number"}</p>
                  <p>{buildCheckoutAddress(checkoutForm) || "Add address and pincode"}</p>
                </div>

                <div className="cart-summary-card__section">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(cartTotal)}</strong>
                  </div>
                  <div className="cart-summary-row">
                    <span>Delivery Fee</span>
                    <strong className="cart-summary-row__free">Free</strong>
                  </div>
                  <div className="cart-summary-row cart-summary-row--total">
                    <span>Total</span>
                    <strong>{formatCurrency(cartTotal)}</strong>
                  </div>
                </div>

                <div className="cart-summary-card__section">
                  <span className="cart-section-label">Payment Method</span>
                  <div className="cart-payment-toggle">
                    <button
                      type="button"
                      className={paymentMethod === "upi" ? "cart-payment-button cart-payment-button--active" : "cart-payment-button"}
                      onClick={() => setPaymentMethod("upi")}
                    >
                      Razorpay Test Mode
                    </button>
                    <button
                      type="button"
                      className={paymentMethod === "cod" ? "cart-payment-button cart-payment-button--active" : "cart-payment-button"}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>

                <button className="btn btn--primary btn--large btn--block" disabled={placingOrders} onClick={handleCheckout}>
                  {placingOrders ? "Securing Proofs..." : "Place Secure Order"}
                </button>

                <div className="cart-summary-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <span>Your transaction is protected by end-to-end blockchain verification.</span>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}
