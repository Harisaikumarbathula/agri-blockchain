import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import OrderTimeline from "../components/OrderTimeline";
import DeliveryMap from "../components/DeliveryMap";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import {
  extractErrorMessage,
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  shortenHash,
} from "../utils/formatters";

export default function TrackOrderPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      // Don't show loader on background polls
      if (!order) setLoading(true);
      try {
        const { data } = await api.get(`/track/${orderNumber}`);
        setOrder(data.order);
      } catch (loadError) {
        setError(extractErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
    const intervalId = setInterval(loadOrder, 5000); // 5 sec poll
    
    return () => clearInterval(intervalId);
  }, [orderNumber]);

  if (loading) {
    return <Loader label="Loading traceability details..." />;
  }

  if (!order) {
    return <Alert type="danger" message={error || "Order not found."} />;
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Public traceability</span>
          <h1>{order.orderNumber}</h1>
        </div>
      </div>

      <Alert type="danger" message={error} />
      
      {order.status === "out_for_delivery" && order.location && (
         <DeliveryMap location={order.location} orderNumber={order.orderNumber} />
      )}

      <div className="split-grid split-grid--wide">
        <div className="card stack">
          <h2>Order Summary</h2>
          <div className="meta-grid">
            <span>Product: {order.product?.name}</span>
            <span>Category: {order.product?.category}</span>
            <span>Quantity: {order.quantity} {order.product?.unit}</span>
            <span>Total: {formatCurrency(order.totalPaise)}</span>
            <span>Payment Method: {formatPaymentMethod(order.paymentMethod)}</span>
            <span>Payment Status: {order.paymentStatus}</span>
            <span>Payment Reference: {order.paymentReference || "-"}</span>
            <span>Placed: {formatDate(order.createdAt)}</span>
          </div>

          <OrderTimeline
            status={order.status}
            paymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
          />
        </div>

        <div className="card stack">
          <h2>Product Provenance</h2>
          <div className="meta-grid">
            <span>Batch Code: {order.product?.batchCode}</span>
            <span>Origin: {order.product?.originLocation}</span>
            <span>Harvest Date: {formatDate(order.product?.harvestDate)}</span>
          </div>
        </div>
      </div>

      <div className="card stack">
        <h2>Blockchain References</h2>
        <div className="list-row">
          <span>Order Created</span>
          <code>{shortenHash(order.blockchainRefs?.orderCreated)}</code>
        </div>
        {order.blockchainRefs?.paymentRecorded && (
          <div className="list-row">
            <span>Payment Recorded</span>
            <code>{shortenHash(order.blockchainRefs.paymentRecorded)}</code>
          </div>
        )}
        {order.blockchainRefs?.statusUpdated?.confirmed && (
          <div className="list-row">
            <span>Confirmed</span>
            <code>{shortenHash(order.blockchainRefs.statusUpdated.confirmed)}</code>
          </div>
        )}
        {order.blockchainRefs?.statusUpdated?.shipped && (
          <div className="list-row">
            <span>Shipped</span>
            <code>{shortenHash(order.blockchainRefs.statusUpdated.shipped)}</code>
          </div>
        )}
        {order.blockchainRefs?.statusUpdated?.delivered && (
          <div className="list-row">
            <span>Delivered</span>
            <code>{shortenHash(order.blockchainRefs.statusUpdated.delivered)}</code>
          </div>
        )}
        {order.blockchainRefs?.codCollected && (
          <div className="list-row">
            <span>COD Collected</span>
            <code>{shortenHash(order.blockchainRefs.codCollected)}</code>
          </div>
        )}
        {order.blockchainRefs?.cancelled && (
          <div className="list-row">
            <span>Cancelled</span>
            <code>{shortenHash(order.blockchainRefs.cancelled)}</code>
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>Timeline History</h2>
        {order.statusHistory?.map((entry) => (
          <div key={`${entry.status}-${entry.changedAt}`} className="list-row">
            <span>{entry.status}</span>
            <span>{formatDate(entry.changedAt)}</span>
          </div>
        ))}
        {order.paymentHistory?.map((entry) => (
          <div key={`${entry.status}-${entry.reference}-${entry.changedAt}`} className="list-row">
            <span>{entry.status} payment</span>
            <span>
              {entry.reference || "-"} • {formatDate(entry.changedAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
