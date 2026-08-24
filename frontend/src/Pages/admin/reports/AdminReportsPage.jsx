import { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Landmark,
  Users,
} from "lucide-react";

import PageHeader from "../../../Components/layout/PageHeader";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ReportKpiCard from "../../../Components/admin/reports/ReportKpiCard";
import SimpleBarChart from "../../../Components/admin/reports/SimpleBarChart";
import { formatNumber } from "../../../Utils/numberFormat";
import {
  apiGetBookingsReport,
  apiGetPaymentsReport,
  apiGetProgramsReport,
  apiGetReportsOverview,
} from "../../../services/api/admin/reports";

const initialFilters = {
  dateFrom: "",
  dateTo: "",
  bookingStatus: "",
  paymentStatus: "",
  paymentMethod: "",
  programId: "",
};
const money = (value) => `${formatNumber(value, { maximumFractionDigits: 2 })} SAR`;

export default function AdminReportsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [data, setData] = useState({
    overview: null,
    bookings: null,
    payments: null,
    programs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value),
      );
      const [overview, bookings, payments, programs] = await Promise.all([
        apiGetReportsOverview(params),
        apiGetBookingsReport(params),
        apiGetPaymentsReport(params),
        apiGetProgramsReport(params),
      ]);
      setData({
        overview: overview.data?.data || null,
        bookings: bookings.data?.data || null,
        payments: payments.data?.data || null,
        programs: programs.data?.data || [],
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          (isArabic ? "تعذر تحميل التقارير" : "Unable to load reports"),
      );
    } finally {
      setLoading(false);
    }
  }, [filters, isArabic]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const bookingChart = useMemo(
    () =>
      Object.entries(data.bookings?.byStatus || {}).map(([key, value]) => ({
        label: isArabic
          ? {
              confirmed: "مؤكد",
              pending: "معلق",
              cancelled: "ملغي",
              completed: "مكتمل",
              draft: "مسودة",
            }[key] || key
          : key,
        value,
      })),
    [data.bookings, isArabic],
  );
  const paymentStatusChart = useMemo(
    () =>
      Object.entries(data.payments?.transactions || {})
        .filter(([key]) => ["successful", "failed", "pending"].includes(key))
        .map(([key, value]) => ({
          label: isArabic
            ? { successful: "ناجحة", failed: "فاشلة", pending: "معلقة" }[key]
            : key,
          value,
        })),
    [data.payments, isArabic],
  );
  const methodChart = useMemo(
    () =>
      (data.payments?.byMethod || []).map((item) => ({
        label: item.code,
        value: item.settledAmount,
      })),
    [data.payments],
  );
  const programBookingChart = useMemo(
    () =>
      data.programs.map((item) => ({
        label: isArabic
          ? item.programNameAr || item.programNameEn
          : item.programNameEn || item.programNameAr,
        value: item.bookingsCount,
      })),
    [data.programs, isArabic],
  );
  const programTravelerChart = useMemo(
    () =>
      data.programs.map((item) => ({
        label: isArabic
          ? item.programNameAr || item.programNameEn
          : item.programNameEn || item.programNameAr,
        value: item.travelersCount,
      })),
    [data.programs, isArabic],
  );

  const programColumns = useMemo(
    () => [
      {
        header: isArabic ? "البرنامج" : "Program",
        accessor: isArabic ? "programNameAr" : "programNameEn",
      },
      { header: isArabic ? "الحجوزات" : "Bookings", accessor: "bookingsCount", excelType: "number" },
      {
        header: isArabic ? "المعتمرون" : "Travelers",
        accessor: "travelersCount",
        excelType: "number",
      },
      {
        header: isArabic ? "قيمة الحجوزات" : "Gross value",
        render: (row) => money(row.grossBookingValue, lang),
        excelAccessor: "grossBookingValue",
        excelType: "number",
      },
      {
        header: isArabic ? "المدفوع" : "Paid",
        render: (row) => money(row.paidAmount, lang),
        excelAccessor: "paidAmount",
        excelType: "number",
      },
      { header: isArabic ? "العملة" : "Currency", render: () => "SAR", excelValue: () => "SAR" },
    ],
    [isArabic, lang],
  );

  const overview = data.overview || {};
  const fieldClassName =
    "!rounded-xl !border-slate-200 !bg-white/80 !px-3 !py-2.5 !text-sm !shadow-none transition focus:!border-blue-400 focus:!ring-4 focus:!ring-blue-100";
  const filterLabelClassName = "mb-2 block text-xs font-bold text-slate-600";
  return (
    <div
      className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-50 via-blue-50/60 to-emerald-50/50 p-3 sm:p-5 lg:p-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        className="pointer-events-none absolute -start-24 top-24 -z-10 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -end-24 top-1/3 -z-10 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-20 start-1/3 -z-10 h-56 w-56 rounded-full bg-violet-300/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="space-y-8">
        <PageHeader
          eyebrowAr="التقارير الإدارية"
          eyebrowEn="Admin reports"
          titleAr="التقارير المالية والتشغيلية"
          titleEn="Financial & Operational Reports"
          subtitleAr="مؤشرات مجمعة من الحجوزات ومعاملات الدفع مباشرة."
          subtitleEn="Aggregated indicators sourced directly from bookings and payment transactions."
        />
        <LoadingOverlay
          show={loading}
          text={isArabic ? "جاري تحميل التقارير..." : "Loading reports..."}
        />
        <ErrorOverlay show={Boolean(error)} message={error} />

        <section className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-200/70 pb-4">
            <span className="rounded-2xl bg-blue-100 p-2.5 text-blue-700">
              <CalendarDays size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isArabic ? "تصفية بيانات التقارير" : "Filter report data"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isArabic
                  ? "حدّد الفترة والحالات المطلوبة للحصول على مؤشرات أدق."
                  : "Choose a period and statuses for more focused indicators."}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <label>
              <span className={filterLabelClassName}>
                {isArabic ? "من تاريخ" : "From date"}
              </span>
              <Form.Control
                className={fieldClassName}
                type="date"
                aria-label="dateFrom"
                value={draftFilters.dateFrom}
                onChange={(event) =>
                  setDraftFilters((old) => ({
                    ...old,
                    dateFrom: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span className={filterLabelClassName}>
                {isArabic ? "إلى تاريخ" : "To date"}
              </span>
              <Form.Control
                className={fieldClassName}
                type="date"
                aria-label="dateTo"
                value={draftFilters.dateTo}
                onChange={(event) =>
                  setDraftFilters((old) => ({
                    ...old,
                    dateTo: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span className={filterLabelClassName}>
                {isArabic ? "حالة الحجز" : "Booking status"}
              </span>
              <Form.Select
                className={fieldClassName}
                aria-label="bookingStatus"
                value={draftFilters.bookingStatus}
                onChange={(event) =>
                  setDraftFilters((old) => ({
                    ...old,
                    bookingStatus: event.target.value,
                  }))
                }
              >
                <option value="">
                  {isArabic ? "كل حالات الحجز" : "All booking statuses"}
                </option>
                {[
                  "draft",
                  "pending",
                  "confirmed",
                  "completed",
                  "cancelled",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Form.Select>
            </label>
            <label>
              <span className={filterLabelClassName}>
                {isArabic ? "حالة الدفع" : "Payment status"}
              </span>
              <Form.Select
                className={fieldClassName}
                aria-label="paymentStatus"
                value={draftFilters.paymentStatus}
                onChange={(event) =>
                  setDraftFilters((old) => ({
                    ...old,
                    paymentStatus: event.target.value,
                  }))
                }
              >
                <option value="">
                  {isArabic ? "كل حالات الدفع" : "All payment statuses"}
                </option>
                {["pending", "partial", "paid", "failed", "refunded"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </Form.Select>
            </label>
            <label>
              <span className={filterLabelClassName}>
                {isArabic ? "طريقة الدفع" : "Payment method"}
              </span>
              <Form.Select
                className={fieldClassName}
                aria-label="paymentMethod"
                value={draftFilters.paymentMethod}
                onChange={(event) =>
                  setDraftFilters((old) => ({
                    ...old,
                    paymentMethod: event.target.value,
                  }))
                }
              >
                <option value="">
                  {isArabic ? "كل طرق الدفع" : "All payment methods"}
                </option>
                {[
                  "BANK_TRANSFER",
                  "CARD",
                  "MADA",
                  "VISA",
                  "MASTERCARD",
                  "APPLE_PAY",
                  "STC_PAY",
                  "CASH",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Form.Select>
            </label>
            <label>
              <span className={filterLabelClassName}>
                {isArabic ? "معرّف البرنامج" : "Program ID"}
              </span>
              <Form.Control
                className={fieldClassName}
                aria-label="programId"
                placeholder={isArabic ? "مثال: 64..." : "Example: 64..."}
                value={draftFilters.programId}
                onChange={(event) =>
                  setDraftFilters((old) => ({
                    ...old,
                    programId: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <ActionButton
              action="apply"
              showLabel
              className="!rounded-xl !px-4 !py-2.5"
              onClick={() => setFilters(draftFilters)}
            />
          </div>
        </section>

        {!loading && !error && (
          <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReportKpiCard
                icon={CalendarDays}
                label={isArabic ? "إجمالي الحجوزات" : "Total bookings"}
                value={overview.bookings?.total || 0}
                tone="violet"
              />
              <ReportKpiCard
                icon={Users}
                label={isArabic ? "إجمالي المعتمرين" : "Total travelers"}
                value={overview.travelers?.total || 0}
                tone="blue"
              />
              <ReportKpiCard
                icon={CircleDollarSign}
                label={
                  isArabic ? "إجمالي قيمة الحجوزات" : "Gross booking value"
                }
                value={money(overview.payments?.totalAmount, lang)}
                tone="slate"
              />
              <ReportKpiCard
                icon={Banknote}
                label={isArabic ? "المدفوع" : "Paid"}
                value={money(overview.payments?.paidAmount, lang)}
                tone="emerald" // green
              />
              <ReportKpiCard
                icon={CreditCard}
                label={isArabic ? "المتبقي" : "Remaining"}
                value={money(overview.payments?.remainingAmount, lang )}
                tone="amber"
              />
              <ReportKpiCard
                icon={AlertTriangle}
                label={isArabic ? "تحتاج تدخلًا" : "Attention required"}
                value={overview.bookings?.attentionRequired || 0}
                tone="rose"
              />
              <ReportKpiCard
                icon={Landmark}
                label={
                  isArabic ? "تحويلات قيد المراجعة" : "Transfers under review"
                }
                value={overview.bankTransfers?.pendingReview || 0}
                tone="amber"
              />
              <ReportKpiCard
                icon={Clock3}
                label={
                  isArabic ? "مدفوع بانتظار الحجز" : "Paid pending booking"
                }
                value={overview.payments?.paidPendingBooking || 0}
                tone="rose"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <PublicSectionCard
                title={isArabic ? "الحجوزات حسب الحالة" : "Bookings by status"}
                subtitle={
                  isArabic
                    ? "توزيع الحجوزات المسجلة حسب حالتها الحالية"
                    : "Current distribution of recorded bookings"
                }
                className="border-white/80 shadow-lg shadow-slate-200/40"
              >
                <SimpleBarChart
                  data={bookingChart}
                  emptyLabel={isArabic ? "لا توجد بيانات" : "No data"}
                />
              </PublicSectionCard>
              <PublicSectionCard
                title={
                  isArabic ? "معاملات الدفع حسب الحالة" : "Payments by status"
                }
                subtitle={
                  isArabic
                    ? "مقارنة المعاملات الناجحة والفاشلة والمعلقة"
                    : "Successful, failed and pending transactions"
                }
                className="border-white/80 shadow-lg shadow-slate-200/40"
              >
                <SimpleBarChart
                  data={paymentStatusChart}
                  emptyLabel={isArabic ? "لا توجد بيانات" : "No data"}
                />
              </PublicSectionCard>
              <PublicSectionCard
                title={
                  isArabic ? "المدفوعات حسب الطريقة" : "Payments by method"
                }
                subtitle={
                  isArabic
                    ? "القيمة المحصلة عبر كل وسيلة دفع"
                    : "Settled value across each payment method"
                }
                className="border-white/80 shadow-lg shadow-slate-200/40"
              >
                <SimpleBarChart
                  data={methodChart}
                  valueFormatter={(value) => money(value, lang)}
                  emptyLabel={isArabic ? "لا توجد بيانات" : "No data"}
                />
              </PublicSectionCard>
              <PublicSectionCard
                title={
                  isArabic ? "البرامج حسب الحجوزات" : "Programs by bookings"
                }
                subtitle={
                  isArabic
                    ? "البرامج الأعلى من حيث عدد الحجوزات"
                    : "Programs ranked by booking volume"
                }
                className="border-white/80 shadow-lg shadow-slate-200/40"
              >
                <SimpleBarChart
                  data={programBookingChart}
                  emptyLabel={isArabic ? "لا توجد بيانات" : "No data"}
                />
              </PublicSectionCard>
              <PublicSectionCard
                title={
                  isArabic ? "البرامج حسب المعتمرين" : "Programs by travelers"
                }
                subtitle={
                  isArabic
                    ? "مقارنة أعداد المعتمرين بين البرامج"
                    : "Traveler volume across programs"
                }
                className="border-white/80 shadow-lg shadow-slate-200/40 xl:col-span-2"
              >
                <SimpleBarChart
                  data={programTravelerChart}
                  emptyLabel={isArabic ? "لا توجد بيانات" : "No data"}
                />
              </PublicSectionCard>
            </div>

            <PublicSectionCard
              title={isArabic ? "تفاصيل البرامج" : "Program details"}
              subtitle={
                isArabic
                  ? "عرض تفصيلي قابل للتصدير للبرامج ضمن الفلاتر المحددة."
                  : "Exportable program details for the selected filters."
              }
              className="overflow-hidden border-white/80 shadow-lg shadow-slate-200/40"
            >
              <div className="mb-4">
                <ExportTableButtons
                  data={data.programs}
                  columns={programColumns}
                  fileName="program-report"
                  lang={lang} 
                  title={isArabic ? "تقرير البرامج" : "Program report"}
                />
              </div>
              <UniversalTable
                columns={programColumns}
                data={data.programs}
                lang={lang}
                emptyMessage={
                  isArabic
                    ? "لا توجد برامج ضمن الفلاتر"
                    : "No programs match the filters"
                }
              />
            </PublicSectionCard>
          </>
        )}
      </div>
    </div>
  );
}

