import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { extractErrorMessage } from "../utils/formatters";

const initialFilters = {
  category: "",
  search: "",
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: {
          category: filters.category || undefined,
          search: filters.search || undefined,
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
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleFilterSubmit = (event) => {
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

  return (
    <section className="stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Transparent agricultural marketplace</span>
          <h1>Browse directly from local farmers</h1>
          <p>
            Checkout uses INR with simulated UPI or COD, while the backend records product and
            order proofs on Ganache for traceability.
          </p>
        </div>

        <form className="filter-bar" onSubmit={handleFilterSubmit}>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by product name"
          />
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="grains">Grains</option>
            <option value="dairy">Dairy</option>
            <option value="other">Other</option>
          </select>
          <button className="btn btn--primary" type="submit">
            Search
          </button>
        </form>
      </div>

      <Alert type="info" message={message} />
      <Alert type="danger" message={error} />

      {loading ? (
        <Loader label="Loading marketplace products..." />
      ) : products.length === 0 ? (
        <div className="empty-state">No products match your current search.</div>
      ) : (
        <div className="card-grid">
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
    </section>
  );
}
