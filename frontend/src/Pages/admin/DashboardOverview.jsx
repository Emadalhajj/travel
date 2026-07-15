// src/pages/admin/DashboardOverview.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function DashboardOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("/api/admin/statistics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner animation="border" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("adminDashboard.statistics_title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title={t("adminDashboard.total_orders_title")}
          value={stats?.totalOrders ?? 0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title={t("adminDashboard.total_users_title")}
          value={stats?.totalUsers ?? 0}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title={t("adminDashboard.total_products_title")}
          value={stats?.totalProducts ?? 0}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title={t("adminDashboard.total_revenue_title")}
          value={`${(stats?.totalRevenue ?? 0).toLocaleString()} ${t("adminDashboard.currency")}`}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* يمكنك إضافة المزيد من الكروت أو الرسوم البيانية هنا */}
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} rounded-xl shadow-lg p-6 text-white`}>
      <h3 className="text-lg font-medium opacity-90">{title}</h3>
      <p className="text-3xl font-bold mt-3">{value}</p>
    </div>
  );
}