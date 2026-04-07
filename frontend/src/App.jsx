import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MarketplacePage from "./pages/MarketplacePage";
import CartPage from "./pages/CartPage";
import FarmerDashboardPage from "./pages/FarmerDashboardPage";
import BuyerOrdersPage from "./pages/BuyerOrdersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import DashboardPage from "./pages/DashboardPage";
import TrackOrderPage from "./pages/TrackOrderPage";

import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="marketplace" element={<MarketplacePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["buyer"]} />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="buyer/orders" element={<BuyerOrdersPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["farmer"]} />}>
            <Route path="farmer/dashboard" element={<FarmerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/analytics" element={<DashboardPage />} />
          </Route>

          <Route path="track/:orderNumber" element={<TrackOrderPage />} />

          <Route path="*" element={<div className="empty-state">Page not found.</div>} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </>
  );
}
