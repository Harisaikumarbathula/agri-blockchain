import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../api/client";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { extractErrorMessage } from "../utils/formatters";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: analyticsData } = await api.get("/track/analytics");
      setData(analyticsData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <Loader label="Loading delivery analytics..." />;
  if (error) return <Alert type="danger" message={error} />;
  if (!data) return <Alert type="info" message="No analytics data available." />;

  const pieData = [
    { name: "Pending", value: data.pendingOrders },
    { name: "Out for Delivery", value: data.outForDelivery },
    { name: "Delivered", value: data.deliveredOrders },
  ];

  const barData = [
    { name: "Orders", total: data.totalOrders, pending: data.pendingOrders, delivered: data.deliveredOrders }
  ];

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Real-time stats</span>
          <h1>Delivery Analytics</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Orders</span>
          <strong>{data.totalOrders}</strong>
        </div>
        <div className="stat-card">
          <span>Out for Delivery</span>
          <strong>{data.outForDelivery}</strong>
        </div>
        <div className="stat-card">
          <span>Delivered</span>
          <strong>{data.deliveredOrders}</strong>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{data.pendingOrders}</strong>
        </div>
      </div>

      <div className="split-grid split-grid--wide">
        <div className="card stack">
          <h2>Order Status Distribution</h2>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card stack">
          <h2>Fulfillment Overview</h2>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" fill="#FFBB28" name="Pending" />
                <Bar dataKey="delivered" fill="#00C49F" name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
