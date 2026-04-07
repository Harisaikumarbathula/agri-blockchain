import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { extractErrorMessage } from "../utils/formatters";

export default function MarketplacePage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: {
          category: category || undefined,
          search: search || undefined,
        },
      });
      setProducts(data.products);
      setError("");
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category]); // Auto-fetch on category change

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = (product) => {
    if (user?.role !== "buyer") {
      setMessage("Login as a buyer to add produce to the cart.");
      return;
    }
    addToCart(product, 1);
    setMessage(`${product.name} was added to your cart.`);
  };

  const categories = [
    { id: "", label: "All" },
    { id: "vegetables", label: "Vegetables" },
    { id: "fruits", label: "Fruits" },
    { id: "grains", label: "Grains" },
    { id: "spices", label: "Spices" },
    { id: "dairy", label: "Dairy" },
    { id: "other", label: "Other" },
  ];

  return (
    <section className="stack" style={{ gap: '3rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="eyebrow">Direct from the source</div>
          <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Marketplace</h1>
          <p style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-muted)', fontWeight: '500', maxWidth: '500px', lineHeight: '1.5' }}>Discover verified, traceable produce directly from local farmers.</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '350px', boxShadow: 'var(--shadow-card)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '1rem', color: 'var(--color-primary)', opacity: '0.6' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '0.6rem 1rem', width: '100%', outline: 'none', fontSize: '1rem', boxShadow: 'none' }}
          />
          <button type="submit" className="btn btn--primary" style={{ padding: '0.6rem 1.25rem' }}>Search</button>
        </form>
      </header>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em', marginRight: '0.5rem' }}>Categories:</span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={category === cat.id ? "btn btn--primary" : "btn btn--secondary"}
            style={{ 
              padding: '0.5rem 1.25rem', 
              fontSize: '0.85rem',
              background: category === cat.id ? 'var(--color-primary)' : 'white',
              boxShadow: category === cat.id ? '0 4px 12px rgba(30, 112, 65, 0.2)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '400px' }}>
        {message && <Alert type="success" message={message} />}
        {error && <Alert type="danger" message={error} />}

        {loading ? (
          <Loader label="Curating fresh produce for you..." />
        ) : products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--color-background)', borderStyle: 'dashed' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1.5rem', opacity: '0.3' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No produce found</h3>
            <p style={{ color: 'var(--color-muted)' }}>Try adjusting your search or category filters.</p>
            <button className="btn btn--secondary" style={{ marginTop: '1.5rem' }} onClick={() => {setSearch(""); setCategory(""); fetchProducts();}}>Clear all filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                userRole={user?.role}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}