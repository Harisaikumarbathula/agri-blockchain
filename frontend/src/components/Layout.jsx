import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
      <footer className="footer">
        © 2026 AgriChain. Verified farm-to-table traceability.
      </footer>
    </div>
  );
}

