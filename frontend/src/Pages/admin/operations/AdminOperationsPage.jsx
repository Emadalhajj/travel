import { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../Components/layout/PageHeader";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import Pagination from "../../../Components/common/Pagination";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import ReportKpiCard from "../../../Components/admin/reports/ReportKpiCard";
import { apiGetBookingOperations } from "../../../services/api/admin/operations";
import { apiGetReportsOverview } from "../../../services/api/admin/reports";

const initialFilters = { search: "", bookingStatus: "", paymentStatus: "", paymentMethod: "", dateFrom: "", dateTo: "", page: 1, limit: 20 };

export default function AdminOperationsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOperations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
      const reportParams = Object.fromEntries(Object.entries(filters)
        .filter(([key, value]) => !["search", "page", "limit"].includes(key) && value));
      const [response, overviewResponse] = await Promise.all([
        apiGetBookingOperations(params),
        apiGetReportsOverview(reportParams),
      ]);
      const payload = response.data || {};
      const sorted = [...(payload.items || [])].sort((left, right) => Number(right.attentionRequired) - Number(left.attentionRequired));
      setItems(sorted);
      setPagination(payload.pagination || { page: filters.page, limit: filters.limit, total: 0, totalPages: 0 });
      setOverview(overviewResponse.data?.data || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || (isArabic ? "تعذر تحميل العمليات" : "Unable to load operations"));
    } finally {
      setLoading(false);
    }
  }, [filters, isArabic]);

  useEffect(() => { loadOperations(); }, [loadOperations]);
  const setPageFilter = (key, value) => setFilters((old) => ({ ...old, [key]: value }));

  const columns = useMemo(() => [
    { header: isArabic ? "رقم الحجز" : "Booking", accessor: "bookingNumber" },
    { header: isArabic ? "العميل" : "Customer", accessor: "customer.name" },
    { header: isArabic ? "حالة الحجز" : "Booking status", render: (row) => <StatusBadge value={row.bookingStatus} isArabic={isArabic} /> },
    { header: isArabic ? "حالة الدفع" : "Payment status", render: (row) => <StatusBadge value={row.paymentStatus} type="payment" isArabic={isArabic} /> },
    { header: isArabic ? "آخر معاملة" : "Latest payment", accessor: "latestPayment.status" },
    { header: isArabic ? "المبلغ" : "Amount", render: (row) => `${Number(row.pricing?.totalPrice || 0).toLocaleString()} ${row.pricing?.currency || "SAR"}` },
    { header: isArabic ? "يتطلب تدخلًا" : "Attention", render: (row) => row.attentionRequired ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">{isArabic ? "نعم" : "Yes"}</span> : <span className="text-slate-400">—</span> },
    { header: isArabic ? "الإجراءات" : "Actions", exportable: false, render: (row) => <ActionButton action="view" showLabel label={isArabic ? "عرض 360°" : "View 360°"} onClick={() => navigate(`/admin/operations/bookings/${row.id}`)} /> },
  ], [isArabic, navigate]);

  const attentionCount = overview?.bookings?.attentionRequired || 0;
  const failedCount = overview?.payments?.failedTransactions || 0;
  const pendingBookingCount = overview?.payments?.paidPendingBooking || 0;
  const bankReviewCount = overview?.bankTransfers?.pendingReview || 0;

  return (
    <div className="position-relative space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader
        eyebrowAr="مركز التشغيل"
        eyebrowEn="Operations center"
        titleAr="لوحة العمليات"
        titleEn="Operations Dashboard"
        subtitleAr="الحجوزات وحالات الدفع التي تحتاج متابعة سريعة."
        subtitleEn="Bookings and payment states that need fast operational follow-up."
      />
      <LoadingOverlay show={loading} text={isArabic ? "جاري تحميل العمليات..." : "Loading operations..."} />
      <ErrorOverlay show={Boolean(error)} message={error} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard label={isArabic ? "تحتاج تدخلًا" : "Attention required"} value={attentionCount} tone="rose" />
        <ReportKpiCard label="PAID_PENDING_BOOKING" value={pendingBookingCount} tone="amber" />
        <ReportKpiCard label={isArabic ? "تحويلات قيد المراجعة" : "Transfers under review"} value={bankReviewCount} tone="amber" />
        <ReportKpiCard label={isArabic ? "فشل الدفع" : "Payment failures"} value={failedCount} tone="rose" />
      </div>

      <PublicSectionCard title={isArabic ? "بحث وتصفية" : "Search and filters"}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Form.Control aria-label="search" placeholder={isArabic ? "رقم الحجز أو العميل" : "Booking or customer"} value={draftFilters.search} onChange={(event) => setDraftFilters((old) => ({ ...old, search: event.target.value }))} />
          <Form.Select aria-label="bookingStatus" value={draftFilters.bookingStatus} onChange={(event) => setDraftFilters((old) => ({ ...old, bookingStatus: event.target.value }))}>
            <option value="">{isArabic ? "كل حالات الحجز" : "All booking statuses"}</option>
            {["draft", "pending", "confirmed", "completed", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}
          </Form.Select>
          <Form.Select aria-label="paymentStatus" value={draftFilters.paymentStatus} onChange={(event) => setDraftFilters((old) => ({ ...old, paymentStatus: event.target.value }))}>
            <option value="">{isArabic ? "كل حالات الدفع" : "All payment statuses"}</option>
            {["pending", "partial", "paid", "failed", "refunded"].map((value) => <option key={value} value={value}>{value}</option>)}
          </Form.Select>
          <Form.Select aria-label="paymentMethod" value={draftFilters.paymentMethod} onChange={(event) => setDraftFilters((old) => ({ ...old, paymentMethod: event.target.value }))}>
            <option value="">{isArabic ? "كل الطرق" : "All methods"}</option>
            {["BANK_TRANSFER", "CARD", "MADA", "VISA", "MASTERCARD", "APPLE_PAY", "STC_PAY", "CASH"].map((value) => <option key={value} value={value}>{value}</option>)}
          </Form.Select>
          <Form.Control type="date" aria-label="dateFrom" value={draftFilters.dateFrom} onChange={(event) => setDraftFilters((old) => ({ ...old, dateFrom: event.target.value }))} />
          <Form.Control type="date" aria-label="dateTo" value={draftFilters.dateTo} onChange={(event) => setDraftFilters((old) => ({ ...old, dateTo: event.target.value }))} />
        </div>
        <div className="mt-4"><ActionButton action="apply" showLabel onClick={() => setFilters({ ...draftFilters, page: 1, limit: filters.limit })} /></div>
      </PublicSectionCard>

      {!error && <PublicSectionCard title={isArabic ? "الحجوزات التشغيلية" : "Operational bookings"} className="overflow-hidden">
        <div className="mb-4"><ExportTableButtons data={items} columns={columns} fileName="operations" lang={lang} title={isArabic ? "تقرير العمليات" : "Operations report"} /></div>
        <UniversalTable columns={columns} data={items} lang={lang} emptyMessage={isArabic ? "لا توجد حالات تشغيلية ضمن الفلاتر" : "No operations match the filters"} />
        <div className="mt-4">
          <Pagination
            {...pagination}
            onPageChange={(page) => setPageFilter("page", page)}
            onLimitChange={(limit) => setFilters((old) => ({ ...old, page: 1, limit }))}
          />
        </div>
      </PublicSectionCard>}
    </div>
  );
}
