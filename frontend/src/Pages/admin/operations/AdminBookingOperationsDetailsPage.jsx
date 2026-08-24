import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import PageHeader from "../../../Components/layout/PageHeader";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import EmptyState from "../../../Components/shared/common/EmptyState";
import CustomerBookingTimeline from "../../../Components/shared/booking/CustomerBookingTimeline";
import { apiGetBookingOperationsDetails } from "../../../services/api/admin/operations";

const formatDate = (value, lang) => value ? new Date(value).toLocaleString(lang === "ar" ? "en-US" : "en-US") : "—";
const actorName = (actor) => actor ? [actor.firstName, actor.lastName].filter(Boolean).join(" ") || actor.username || actor.email || "—" : "—";
const safeJson = (value) => value == null ? "—" : JSON.stringify(value, null, 2);

export default function AdminBookingOperationsDetailsPage() {
  const { bookingId } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiGetBookingOperationsDetails(bookingId);
        if (active) setDetails(response.data?.data || null);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || requestError.message || (isArabic ? "تعذر تحميل تفاصيل الحجز" : "Unable to load booking details"));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [bookingId, isArabic]);

  const paymentColumns = useMemo(() => [
    { header: isArabic ? "المرجع" : "Reference", accessor: "paymentReference" },
    { header: isArabic ? "الطريقة" : "Method", accessor: "methodCode" },
    { header: isArabic ? "المزود" : "Provider", accessor: "providerCode" },
    { header: isArabic ? "المبلغ" : "Amount", render: (row) => `${Number(row.amount || 0).toLocaleString()} ${row.currency || "SAR"}` },
    { header: isArabic ? "الحالة" : "Status", accessor: "status" },
    { header: isArabic ? "تحقق بواسطة" : "Verified by", render: (row) => actorName(row.verifiedBy) },
    { header: isArabic ? "التاريخ" : "Date", render: (row) => formatDate(row.createdAt, lang) },
  ], [isArabic, lang]);
  const pilgrimColumns = useMemo(() => [
    { header: isArabic ? "الاسم" : "Name", render: (row) => isArabic ? [row.firstNameAr, row.secondNameAr, row.lastNameAr].filter(Boolean).join(" ") : [row.firstNameEn, row.secondNameEn, row.lastNameEn].filter(Boolean).join(" ") },
    { header: isArabic ? "الجواز" : "Passport", accessor: "passportNumber" },
    { header: isArabic ? "الجنسية" : "Nationality", accessor: "nationality" },
    { header: isArabic ? "الجنس" : "Gender", accessor: "gender" },
  ], [isArabic]);

  const booking = details?.booking;
  const latestPayment = details?.payments?.at(-1);
  return (
    <div className="position-relative space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader
        eyebrowAr="Booking 360°"
        eyebrowEn="Booking 360°"
        titleAr={booking?.bookingNumber || "تفاصيل الحجز التشغيلية"}
        titleEn={booking?.bookingNumber || "Booking operations details"}
        subtitleAr="الحجز، الدفع، سجل الأحداث، التدقيق والمخزون في عرض موحد."
        subtitleEn="Booking, payments, timeline, audit and inventory in one view."
        actions={<ActionButton action="back" showLabel />}
      />
      <LoadingOverlay show={loading} text={isArabic ? "جاري تحميل Booking 360°..." : "Loading Booking 360°..."} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      {!loading && !error && !details && <EmptyState title={isArabic ? "الحجز غير موجود" : "Booking not found"} />}

      {details && <>
        {details.attentionRequired && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800">
            {isArabic ? "هذا الحجز يحتاج إلى تدخل أو مراجعة تشغيلية." : "This booking requires operational attention or review."}
          </div>
        )}

        <PublicSectionCard title={isArabic ? "رحلة الحجز المبسطة" : "Simplified booking journey"}>
          <CustomerBookingTimeline
            bookingStatus={booking.bookingStatus}
            paymentStatus={booking.paymentStatus}
            latestPaymentStatus={latestPayment?.status}
            isArabic={isArabic}
          />
        </PublicSectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <PublicSectionCard title={isArabic ? "بيانات الحجز" : "Booking information"}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [isArabic ? "رقم الحجز" : "Booking number", booking.bookingNumber],
                [isArabic ? "حالة الحجز" : "Booking status", <StatusBadge value={booking.bookingStatus} isArabic={isArabic} />],
                [isArabic ? "حالة الدفع" : "Payment status", <StatusBadge value={booking.paymentStatus} type="payment" isArabic={isArabic} />],
                [isArabic ? "طريقة الدفع" : "Payment method", booking.paymentMethod || "—"],
                [isArabic ? "الإجمالي" : "Total", `${Number(booking.pricing?.totalPrice || 0).toLocaleString()} ${booking.pricing?.currency || "SAR"}`],
                [isArabic ? "المدفوع" : "Paid", Number(booking.paidAmount || 0).toLocaleString()],
                [isArabic ? "أنشأه" : "Created by", actorName(booking.createdBy)],
                [isArabic ? "آخر تحديث" : "Updated", formatDate(booking.updatedAt, lang)],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-1 font-bold text-slate-900">{value}</div></div>)}
            </div>
          </PublicSectionCard>
          <PublicSectionCard title={isArabic ? "العميل والبرنامج" : "Customer and program"}>
            <div className="space-y-3 text-sm">
              <p><strong>{isArabic ? "العميل:" : "Customer:"}</strong> {booking.customer?.name || "—"}</p>
              <p><strong>{isArabic ? "البريد:" : "Email:"}</strong> {booking.customer?.email || "—"}</p>
              <p><strong>{isArabic ? "الجوال:" : "Phone:"}</strong> {booking.customer?.phone || "—"}</p>
              <p><strong>{isArabic ? "البرنامج:" : "Program:"}</strong> {(isArabic ? booking.program?.nameAr : booking.program?.nameEn) || booking.program?.nameAr || booking.program?.nameEn || "—"}</p>
              <p><strong>{isArabic ? "الفترة:" : "Period:"}</strong> {formatDate(booking.program?.startDate, lang)} — {formatDate(booking.program?.endDate, lang)}</p>
            </div>
          </PublicSectionCard>
        </div>

        <PublicSectionCard title={isArabic ? "المعتمرون" : "Travelers"} className="overflow-hidden">
          <UniversalTable columns={pilgrimColumns} data={booking.pilgrims || []} lang={lang} emptyMessage={isArabic ? "لا يوجد معتمرون" : "No travelers"} />
        </PublicSectionCard>

        <PublicSectionCard title={isArabic ? "معاملات الدفع" : "Payment transactions"} className="overflow-hidden">
          <UniversalTable columns={paymentColumns} data={details.payments || []} lang={lang} emptyMessage={isArabic ? "لا توجد معاملات دفع" : "No payment transactions"} />
        </PublicSectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <PublicSectionCard title={isArabic ? "الخط الزمني التشغيلي" : "Operational timeline"}>
            <div className="space-y-3">
              {(details.timeline || []).map((entry) => <article key={entry.id || `${entry.action}-${entry.createdAt}`} className="border-s-4 border-emerald-500 bg-slate-50 p-4"><div className="flex justify-between gap-3"><strong>{isArabic ? entry.messageAr || entry.action : entry.messageEn || entry.action}</strong><small>{formatDate(entry.createdAt, lang)}</small></div><p className="mt-1 text-xs text-slate-500">{actorName(entry.performedBy)}</p></article>)}
              {!details.timeline?.length && <p className="text-sm text-slate-400">{isArabic ? "لا توجد أحداث" : "No timeline events"}</p>}
            </div>
          </PublicSectionCard>
          <PublicSectionCard title={isArabic ? "Inventory Hold" : "Inventory hold"}>
            {details.inventory?.hold ? <div className="space-y-3 text-sm">
              <p><strong>Status:</strong> {details.inventory.hold.status}</p>
              <p><strong>{isArabic ? "ينتهي:" : "Expires:"}</strong> {formatDate(details.inventory.hold.expiresAt, lang)}</p>
              <p><strong>{isArabic ? "تم الالتزام:" : "Committed:"}</strong> {formatDate(details.inventory.hold.committedAt, lang)}</p>
              <p><strong>{isArabic ? "الحجوزات:" : "Reservations:"}</strong> {details.inventory.reservations?.length || 0}</p>
            </div> : <p className="text-sm text-slate-400">{isArabic ? "لا يوجد Hold مرتبط" : "No linked hold"}</p>}
          </PublicSectionCard>
        </div>

        <PublicSectionCard title={isArabic ? "سجل التدقيق المرتبط" : "Linked audit history"}>
          <div className="space-y-4">
            {(details.audit || []).map((entry) => <details key={entry.id || `${entry.entity}-${entry.createdAt}`} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-bold">{entry.entity} · {entry.action} · {formatDate(entry.createdAt, lang)} · {actorName(entry.performedBy)}</summary><div className="mt-4 grid gap-4 lg:grid-cols-2"><pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{safeJson(entry.before)}</pre><pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{safeJson(entry.after)}</pre></div></details>)}
            {!details.audit?.length && <p className="text-sm text-slate-400">{isArabic ? "لا توجد سجلات تدقيق مرتبطة" : "No linked audit entries"}</p>}
          </div>
        </PublicSectionCard>
      </>}
    </div>
  );
}

