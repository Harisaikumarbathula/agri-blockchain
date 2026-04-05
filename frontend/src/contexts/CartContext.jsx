import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);
const storageKey = "agri-cart-v3";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });

  const persistItems = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem(storageKey, JSON.stringify(nextItems));
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = items.find((item) => item.product._id === product._id);

    if (existingItem) {
      const nextItems = items.map((item) =>
        item.product._id === product._id
          ? {
              ...item,
              quantity: Math.min(item.quantity + quantity, product.quantity),
            }
          : item
      );
      persistItems(nextItems);
      return;
    }

    persistItems([...items, { product, quantity }]);
  };

  const updateQuantity = (productId, quantity) => {
    const nextItems = items
      .map((item) =>
        item.product._id === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.product.quantity)),
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    persistItems(nextItems);
  };

  const removeFromCart = (productId) => {
    persistItems(items.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    persistItems([]);
  };

  const cartTotal = items.reduce((sum, item) => sum + item.product.pricePaise * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items,
    cartTotal,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
}
