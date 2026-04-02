import { formatCurrency } from "../utils/formatters";

export default function ProductCard({
  product,
  userRole,
  onAddToCart,
  onEdit,
  onDelete,
}) {
  const outOfStock = product.quantity <= 0 || !product.isAvailable;

  return (
    <article className="card product-card">
      <div className="product-card__header">
        <span className="pill">{product.category}</span>
        <span className={`status-badge ${outOfStock ? "status-badge--cancelled" : ""}`}>
          {outOfStock ? "Out of stock" : "Available"}
        </span>
      </div>

      <h3>{product.name}</h3>
      <p className="muted">{product.description || "Fresh produce listed directly by the farmer."}</p>

      <div className="meta-grid">
        <span>Price: {formatCurrency(product.pricePaise)}</span>
        <span>
          Qty: {product.quantity} {product.unit}
        </span>
        <span>Farmer: {product.farmerId?.name || "Farmer"}</span>
        <span>Batch: {product.batchCode}</span>
        <span>Origin: {product.originLocation}</span>
      </div>

      <div className="card__actions">
        {userRole === "buyer" && (
          <button className="btn btn--primary" onClick={() => onAddToCart(product)} disabled={outOfStock}>
            Add to Cart
          </button>
        )}

        {userRole === "farmer" && (
          <>
            <button className="btn btn--secondary" onClick={() => onEdit(product)}>
              Edit
            </button>
            <button className="btn btn--danger" onClick={() => onDelete(product)}>
              Remove
            </button>
          </>
        )}
      </div>
    </article>
  );
}
