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
    <section className="stack" style={{ gap: '3rem' }}>
      <header>
        <div className="eyebrow">Real-time supply chain insights</div>
        <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>Delivery Analytics</h1>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
          </div>
          <span>Total Orders</span>
          <strong>{data.totalOrders}</strong>
          <div className="subtext">Across all regions</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--color-info)' }}>
          <div className="icon" style={{ color: 'var(--color-info)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="13" x="2" y="6" rx="2"/><path d="M16 19h4a2 2 0 0 0 2-2v-1l-3-3h-3v7Z"/><path d="M12 13h.01"/><path d="M18 13h.01"/><path d="M2 10h14"/></svg>
          </div>
          <span style={{ color: 'var(--color-info)' }}>Out for Delivery</span>
          <strong>{data.outForDelivery}</strong>
          <div className="subtext">Currently in transit</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--color-primary)' }}>
          <div className="icon" style={{ color: 'var(--color-primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <span style={{ color: 'var(--color-primary)' }}>Delivered</span>
          <strong>{data.deliveredOrders}</strong>
          <div className="subtext">Successfully completed</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--color-warning)' }}>
          <div className="icon" style={{ color: 'var(--color-warning)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span style={{ color: 'var(--color-warning)' }}>Pending</span>
          <strong>{data.pendingOrders}</strong>
          <div className="subtext">Awaiting fulfillment</div>
        </div>
      </div>

      <div className="split-grid">
        <div className="card stack">
          <h2 style={{ fontSize: '1.5rem' }}>Order Status Distribution</h2>
          <div style={{ height: "300px", width: "100%", marginTop: '1rem' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card stack">
          <h2 style={{ fontSize: '1.5rem' }}>Fulfillment Overview</h2>
          <div style={{ height: "300px", width: "100%", marginTop: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={barData} barGap={12}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="pending" fill="#FFBB28" name="Pending" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="delivered" fill="#1e7041" name="Delivered" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
