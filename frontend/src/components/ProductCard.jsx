import { formatCurrency, formatDate } from "../utils/formatters";
import { Link } from "react-router-dom";

export default function ProductCard({
  product,
  userRole,
  onAddToCart,
  onEdit,
  onDelete,
}) {
  const outOfStock = product.quantity <= 0 || !product.isAvailable;

  return (
    <article className="product-card">
      <div className="product-card__image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
          </div>
        )}
        <span className="product-card__badge">{product.category}</span>
      </div>
      
      <div className="product-card__content">
        <div>
          <h3 className="product-card__title">{product.name}</h3>
          <div className="product-card__location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            {product.originLocation || "Local Farm"}
          </div>
        </div>

        <div className="product-card__price">
          {formatCurrency(product.pricePaise)} <span>/ {product.unit}</span>
        </div>

        <div className="product-card__details">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            <span style={{ fontWeight: '600' }}>{product.quantity} {product.unit} available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span>Harvested {formatDate(product.harvestDate)}</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          {userRole === "farmer" ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => onEdit(product)}>Edit</button>
              <button className="btn btn--secondary" style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'rgba(244, 67, 54, 0.2)' }} onClick={() => onDelete(product)}>Remove</button>
            </div>
          ) : (
            <button 
              className={outOfStock ? "btn btn--secondary btn--block" : "btn btn--primary btn--block"} 
              onClick={() => onAddToCart(product)} 
              disabled={outOfStock}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
