import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  TriangleAlert,
  Users,
} from "lucide-react";

import ReportKpiCard from "../../Components/admin/reports/ReportKpiCard";
import ActionButton from "../../Components/common/buttons/ActionButton";
import EmptyState from "../../Components/shared/common/EmptyState";
import ErrorOverlay from "../../Components/common/feedback/ErrorOverlay";
import LoadingOverlay from "../../Components/common/feedback/LoadingOverlay";
import PageHeader from "../../Components/layout/PageHeader";
import { apiGetReportsOverview } from "../../services/api/admin/reports";

export default function DashboardOverview() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = (i18n.language || "ar") === "ar";
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiGetReportsOverview();
        if (active) setOverview(response.data?.data || response.data || null);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              (isArabic
                ? "تعذر تحميل ملخص لوحة الإدارة"
                : "Unable to load the admin overview"),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, [isArabic]);

  const quickActions = [
    {
      path: "/admin/operations",
      label: isArabic ? "مركز العمليات" : "Operations",
    },
    {
      path: "/admin/reports",
      label: isArabic ? "التقارير" : "Reports",
    },
    {
      path: "/admin/payments",
      label: isArabic ? "إدارة الدفع" : "Payments",
    },
    {
      path: "/admin/inventory",
      label: isArabic ? "إدارة المخزون" : "Inventory",
    },
  ];

  return (
    <div className="container position-relative py-3" dir={isArabic ? "rtl" : "ltr"}>
      <LoadingOverlay
        show={loading}
        text={isArabic ? "جاري تحميل الملخص..." : "Loading overview..."}
      />

      <PageHeader
        titleAr="لوحة التحكم"
        titleEn="Admin Dashboard"
        subtitleAr="نظرة تشغيلية مختصرة وروابط مباشرة إلى أقسام الإدارة الرئيسية."
        subtitleEn="A concise operational overview with direct access to key admin areas."
      />

      <ErrorOverlay show={!loading && Boolean(error)} message={error} />

      {!loading && !error && !overview && (
        <EmptyState
          title={isArabic ? "لا توجد بيانات متاحة" : "No overview data available"}
        />
      )}

      {!loading && !error && overview && (
        <>
          <section aria-labelledby="overview-kpis" className="mb-5">
            <h2 id="overview-kpis" className="mb-3 h5 fw-bold text-slate-800">
              {isArabic ? "المؤشرات الرئيسية" : "Key indicators"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <ReportKpiCard
                label={isArabic ? "إجمالي الحجوزات" : "Total bookings"}
                value={overview.bookings?.total || 0}
                tone="blue"
                icon={BarChart3}
              />
              <ReportKpiCard
                label={isArabic ? "الحجوزات المؤكدة" : "Confirmed bookings"}
                value={overview.bookings?.confirmed || 0}
                tone="emerald"
                icon={CheckCircle2}
              />
              <ReportKpiCard
                label={isArabic ? "المدفوعات الناجحة" : "Successful payments"}
                value={overview.payments?.successfulTransactions || 0}
                tone="violet"
                icon={CreditCard}
              />
              <ReportKpiCard
                label={isArabic ? "تحتاج إلى تدخل" : "Attention required"}
                value={overview.bookings?.attentionRequired || 0}
                tone="rose"
                icon={TriangleAlert}
              />
              <ReportKpiCard
                label={isArabic ? "إجمالي المعتمرين" : "Total travelers"}
                value={overview.travelers?.total || 0}
                tone="amber"
                icon={Users}
              />
            </div>
          </section>

          <section aria-labelledby="quick-actions" className="rounded-3 border bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 id="quick-actions" className="mb-1 h5 fw-bold">
                {isArabic ? "الوصول السريع" : "Quick actions"}
              </h2>
              <p className="mb-0 text-muted">
                {isArabic
                  ? "انتقل مباشرةً إلى المتابعة التشغيلية أو التقارير أو إعدادات الدفع والمخزون."
                  : "Open operations, reports, payment management, or inventory directly."}
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {quickActions.map(({ path, label }) => (
                <ActionButton
                  key={path}
                  action="view"
                  size="md"
                  label={label}
                  onClick={() => navigate(path)}
                  className="gap-2"
                  tooltip={label}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
