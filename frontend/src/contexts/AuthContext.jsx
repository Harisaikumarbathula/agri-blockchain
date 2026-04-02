import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
const storageKey = "agri-auth";

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : { token: "", user: null };
  });
  const [loading, setLoading] = useState(false);

  const persistAuth = (token, user) => {
    const value = { token, user };
    setAuthState(value);
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  const clearAuth = () => {
    setAuthState({ token: "", user: null });
    localStorage.removeItem(storageKey);
  };

  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", credentials);
      persistAuth(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      persistAuth(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!authState.token) {
      return null;
    }

    const { data } = await api.get("/auth/me");
    persistAuth(authState.token, data.user);
    return data.user;
  };

  const logoutUser = () => {
    clearAuth();
  };

  useEffect(() => {
    if (!authState.token) {
      return;
    }

    refreshProfile().catch(() => clearAuth());
  }, []);

  const value = {
    token: authState.token,
    user: authState.user,
    loading,
    isAuthenticated: Boolean(authState.token),
    loginUser,
    registerUser,
    refreshProfile,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
