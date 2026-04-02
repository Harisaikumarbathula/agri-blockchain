import { useState } from "react";
import api from "../api/client";
import { useCart } from "../contexts/CartContext";
import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { extractErrorMessage, formatCurrency, formatPaymentMethod } from "../utils/formatters";

export default function CartPage() {
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [placingOrders, setPlacingOrders] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutOrders, setCheckoutOrders] = useState([]);

  const handleCheckout = async () => {
    setPlacingOrders(true);
    setError("");
    setMessage("");
    const completedProductIds = [];
    const createdOrders = [];

    try {
      for (const item of items) {
        const { data } = await api.post("/orders", {
          productId: item.product._id,
          quantity: Number(item.quantity),
          paymentMethod,
        });

        completedProductIds.push(item.product._id);
        createdOrders.push(data.order);
      }

      completedProductIds.forEach((id) => removeFromCart(id));
      setCheckoutOrders(createdOrders);
      setMessage(
        paymentMethod === "upi"
          ? "Orders created. Simulate each UPI payment below."
          : "COD orders created successfully."
      );
    } catch (checkoutError) {
      completedProductIds.forEach((id) => removeFromCart(id));
      setError(extractErrorMessage(checkoutError));
    } finally {
      setPlacingOrders(false);
    }
  };

  const handleSimulatePayment = async (orderId, outcome) => {
    setBusyOrderId(orderId);
    setError("");
    setMessage("");

    try {
      const { data } = await api.post(`/orders/${orderId}/payment/simulate`, {
        outcome,
      });

      setCheckoutOrders((current) =>
        current.map((order) => (order._id === orderId ? data.order : order))
      );
      setMessage(data.message);
    } catch (paymentError) {
      setError(extractErrorMessage(paymentError));
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Buyer checkout</span>
          <h1>Cart and INR checkout</h1>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={message} />
      {placingOrders && <Loader label="Creating orders and writing proofs to the blockchain..." />}

      {checkoutOrders.length > 0 && (
        <div className="card stack">
          <h2>Recent Checkout</h2>
          {checkoutOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="list-row">
                <strong>{order.orderNumber}</strong>
                <span>{formatPaymentMethod(order.paymentMethod)}</span>
              </div>
              <div className="meta-grid">
                <span>Product: {order.productId?.name}</span>
                <span>Total: {formatCurrency(order.totalPaise)}</span>
                <span>Payment: {order.paymentStatus}</span>
                <span>Reference: {order.paymentReference || "-"}</span>
              </div>

              {order.paymentMethod === "upi" && order.paymentStatus !== "paid" && (
                <div className="card__actions">
                  <button
                    className="btn btn--primary"
                    onClick={() => handleSimulatePayment(order._id, "paid")}
                    disabled={busyOrderId === order._id}
                  >
                    {busyOrderId === order._id ? "Working..." : "Pay UPI Successfully"}
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => handleSimulatePayment(order._id, "failed")}
                    disabled={busyOrderId === order._id}
                  >
                    Mark UPI Failed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">Your cart is empty.</div>
      ) : (
        <div className="split-grid">
          <div className="card">
            <h2>Cart Items</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product._id}>
                      <td>{item.product.name}</td>
                      <td>{formatCurrency(item.product.pricePaise)}</td>
                      <td>
                        <input
                          className="table-input"
                          type="number"
                          min="1"
                          max={item.product.quantity}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(item.product._id, Number(event.target.value))
                          }
                        />
                      </td>
                      <td>{formatCurrency(item.product.pricePaise * item.quantity)}</td>
                      <td>
                        <button
                          className="btn btn--ghost"
                          onClick={() => removeFromCart(item.product._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card stack">
            <h2>Order Summary</h2>
            <p className="summary-total">{formatCurrency(cartTotal)}</p>
            <label>
              <span>Payment Method</span>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="upi">UPI</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </label>
            <p className="muted">
              Orders are priced in INR. The backend signs blockchain proof entries after every
              product, order, payment, and delivery action.
            </p>
            <button className="btn btn--primary btn--block" onClick={handleCheckout} disabled={placingOrders}>
              Place {formatPaymentMethod(paymentMethod)} Order
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
