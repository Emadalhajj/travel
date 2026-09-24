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
import BookingFulfillmentTimeline from "../../../Components/shared/booking/BookingFulfillmentTimeline";
import { getFulfillmentStepLabel, getFulfillmentWorkflow } from "../../../config/bookingFulfillment";
import {
  apiDeliverBookingServiceDocuments,
  apiGetBookingOperationsDetails,
  apiUpdateBookingFulfillment,
  apiUploadBookingServiceDocuments,
} from "../../../services/api/admin/operations";
import FileAttachmentUploader from "../../../Components/common/FileAttachmentUploader";
import AttachmentPreviewCard from "../../../Components/shared/attachments/AttachmentPreviewCard";

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
  const [fulfillmentSaving, setFulfillmentSaving] = useState(false);
  const [fulfillmentReason, setFulfillmentReason] = useState("");
  const [serviceDocumentForm, setServiceDocumentForm] = useState({
    documents: [], documentType: "ticket", titleAr: "", titleEn: "", note: "",
    sendEmail: true, sendWhatsapp: false,
  });
  const [documentSaving, setDocumentSaving] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");

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
  const fulfillmentSteps = getFulfillmentWorkflow(booking?.fulfillment?.serviceType || booking?.serviceType);
  const fulfillmentIndex = fulfillmentSteps.indexOf(booking?.fulfillment?.currentStep);
  const nextFulfillmentStep = fulfillmentSteps[Math.min(Math.max(fulfillmentIndex + 1, 0), fulfillmentSteps.length - 1)];
  const updateFulfillment = async ({ currentStep, status = "in_progress" }) => {
    setFulfillmentSaving(true);
    setError("");
    try {
      await apiUpdateBookingFulfillment(bookingId, {
        currentStep,
        status,
        actionRequiredReason: fulfillmentReason,
      });
      const response = await apiGetBookingOperationsDetails(bookingId);
      setDetails(response.data?.data || null);
      if (status !== "action_required") setFulfillmentReason("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || (isArabic ? "تعذر تحديث تنفيذ الخدمة" : "Unable to update fulfillment"));
    } finally {
      setFulfillmentSaving(false);
    }
  };
  const reloadDetails = async () => {
    const response = await apiGetBookingOperationsDetails(bookingId);
    setDetails(response.data?.data || null);
  };
  const uploadServiceDocuments = async () => {
    if (!serviceDocumentForm.documents.length) return;
    setDocumentSaving(true);
    setError("");
    setDeliveryMessage("");
    try {
      const response = await apiUploadBookingServiceDocuments(bookingId, serviceDocumentForm);
      const delivery = response.data?.data?.delivery || {};
      const failed = Object.entries(delivery).filter(([, value]) => value?.status === "failed");
      setDeliveryMessage(failed.length
        ? (isArabic ? `تم حفظ المستند، وتعذر الإرسال عبر: ${failed.map(([key]) => key).join("، ")}` : `Document saved; delivery failed via: ${failed.map(([key]) => key).join(", ")}`)
        : (isArabic ? "تم حفظ المستند وإرساله عبر القنوات المحددة." : "Document saved and delivered through the selected channels."));
      setServiceDocumentForm((current) => ({ ...current, documents: [], titleAr: "", titleEn: "", note: "" }));
      await reloadDetails();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || (isArabic ? "تعذر رفع مستند الخدمة" : "Unable to upload service document"));
    } finally {
      setDocumentSaving(false);
    }
  };
  const redeliverDocument = async (documentId, channel) => {
    setDocumentSaving(true);
    setError("");
    try {
      const response = await apiDeliverBookingServiceDocuments(bookingId, { documentIds: [documentId], channels: [channel] });
      const result = response.data?.data?.delivery?.[channel];
      setDeliveryMessage(result?.status === "sent"
        ? (isArabic ? "تم إرسال المستند بنجاح." : "Document sent successfully.")
        : (result?.error || (isArabic ? "تعذر إرسال المستند." : "Document delivery failed.")));
      await reloadDetails();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setDocumentSaving(false);
    }
  };
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

        <PublicSectionCard title={isArabic ? "تنفيذ الخدمة" : "Service fulfillment"}>
          <BookingFulfillmentTimeline
            fulfillment={booking.fulfillment}
            serviceType={booking.serviceType}
            isArabic={isArabic}
          />

          {booking.fulfillment?.customerAction?.status === "submitted" && (
            <section className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-emerald-950">
                    {isArabic ? "استجابة العميل" : "Customer response"}
                  </h3>
                  <p className="mt-1 text-xs text-emerald-800">
                    {isArabic ? "تاريخ الإرسال:" : "Submitted at:"}{" "}
                    {formatDate(booking.fulfillment.customerAction.submittedAt, lang)}
                  </p>
                </div>
                <StatusBadge
                  value={booking.fulfillment.customerAction.status}
                  isArabic={isArabic}
                />
              </div>

              <div className="mt-4 rounded-lg border border-emerald-100 bg-white p-3">
                <p className="text-xs font-semibold text-slate-500">
                  {isArabic ? "رسالة العميل" : "Customer message"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {booking.fulfillment.customerAction.note ||
                    (isArabic ? "لم يرفق العميل رسالة." : "The customer did not include a message.")}
                </p>
              </div>

              {booking.fulfillment.customerAction.documents?.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {booking.fulfillment.customerAction.documents.map((document, index) => (
                    <AttachmentPreviewCard
                      key={document.url || `${document.name}-${index}`}
                      label={document.name || `${isArabic ? "مرفق العميل" : "Customer attachment"} ${index + 1}`}
                      value={document.url}
                      isArabic={isArabic}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  {isArabic ? "لم يرفق العميل ملفات." : "The customer did not attach files."}
                </p>
              )}
            </section>
          )}

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={fulfillmentReason}
              onChange={(event) => setFulfillmentReason(event.target.value)}
              placeholder={isArabic ? "سبب الإجراء المطلوب من العميل" : "Reason for customer action"}
            />
            <button
              type="button"
              disabled={fulfillmentSaving || !fulfillmentReason.trim()}
              onClick={() => updateFulfillment({ currentStep: booking.fulfillment?.currentStep || fulfillmentSteps[0], status: "action_required" })}
              className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-white disabled:opacity-50"
            >{isArabic ? "طلب إجراء" : "Require action"}</button>
            <button
              type="button"
              disabled={fulfillmentSaving || booking.fulfillment?.status === "completed" || !nextFulfillmentStep}
              onClick={() => updateFulfillment({ currentStep: nextFulfillmentStep })}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50"
            >{fulfillmentSaving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : `${isArabic ? "الانتقال إلى" : "Move to"} ${getFulfillmentStepLabel(nextFulfillmentStep, isArabic)}`}</button>
          </div>
        </PublicSectionCard>

        <PublicSectionCard title={isArabic ? "مستندات الخدمة والتسليم" : "Service documents and delivery"}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <select className="w-full rounded-lg border p-2" value={serviceDocumentForm.documentType} onChange={(event) => setServiceDocumentForm((current) => ({ ...current, documentType: event.target.value }))}>
                <option value="ticket">{isArabic ? "تذكرة" : "Ticket"}</option>
                <option value="visa">{isArabic ? "تأشيرة" : "Visa"}</option>
                <option value="voucher">Voucher</option>
                <option value="confirmation">{isArabic ? "تأكيد حجز" : "Confirmation"}</option>
                <option value="other">{isArabic ? "أخرى" : "Other"}</option>
              </select>
              <input className="w-full rounded-lg border p-2" placeholder={isArabic ? "العنوان بالعربية" : "Arabic title"} value={serviceDocumentForm.titleAr} onChange={(event) => setServiceDocumentForm((current) => ({ ...current, titleAr: event.target.value }))} />
              <input className="w-full rounded-lg border p-2" placeholder={isArabic ? "العنوان بالإنجليزية" : "English title"} value={serviceDocumentForm.titleEn} onChange={(event) => setServiceDocumentForm((current) => ({ ...current, titleEn: event.target.value }))} />
              <textarea className="w-full rounded-lg border p-2" placeholder={isArabic ? "ملاحظة للعميل" : "Customer note"} value={serviceDocumentForm.note} onChange={(event) => setServiceDocumentForm((current) => ({ ...current, note: event.target.value }))} />
              <FileAttachmentUploader
                labelAr="المستندات المنجزة"
                labelEn="Completed documents"
                name="documents"
                maxFiles={5}
                maxSizeMB={10}
                acceptedTypes=".jpg,.jpeg,.png,.webp,.pdf"
                initialFiles={serviceDocumentForm.documents}
                onChange={(documents) => setServiceDocumentForm((current) => ({ ...current, documents: documents.filter((item) => item instanceof File) }))}
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <label><input type="checkbox" className="me-2" checked={serviceDocumentForm.sendEmail} onChange={(event) => setServiceDocumentForm((current) => ({ ...current, sendEmail: event.target.checked }))} />{isArabic ? "إرسال بالبريد" : "Send by email"}</label>
                <label><input type="checkbox" className="me-2" checked={serviceDocumentForm.sendWhatsapp} onChange={(event) => setServiceDocumentForm((current) => ({ ...current, sendWhatsapp: event.target.checked }))} />{isArabic ? "إرسال بواتساب" : "Send by WhatsApp"}</label>
              </div>
              <button type="button" disabled={documentSaving || !serviceDocumentForm.documents.length} onClick={uploadServiceDocuments} className="rounded-lg bg-sky-600 px-5 py-2 font-bold text-white disabled:opacity-50">
                {documentSaving ? (isArabic ? "جارٍ الحفظ والإرسال..." : "Saving and sending...") : (isArabic ? "حفظ وإرسال" : "Save and deliver")}
              </button>
              {deliveryMessage && <p className="text-sm font-semibold text-slate-700">{deliveryMessage}</p>}
            </div>
            <div className="space-y-3">
              {(booking.serviceDocuments || []).map((document) => <div key={document.id} className="rounded-xl border border-slate-200 p-3">
                <AttachmentPreviewCard label={(isArabic ? document.titleAr : document.titleEn) || document.originalName} value={document.url} isArabic={isArabic} />
                {document.note && <p className="mt-2 text-sm text-slate-600">{document.note}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span>Email: {document.delivery?.email?.status || "not_requested"}</span>
                  <span>WhatsApp: {document.delivery?.whatsapp?.status || "not_requested"}</span>
                </div>
                {document.delivery?.email?.status === "failed" && document.delivery.email.error && (
                  <p className="mt-2 rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                    Email: {document.delivery.email.error}
                  </p>
                )}
                {document.delivery?.whatsapp?.status === "failed" && document.delivery.whatsapp.error && (
                  <p className="mt-2 rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                    WhatsApp: {document.delivery.whatsapp.error}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={documentSaving} onClick={() => redeliverDocument(document.id, "email")} className="rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white">Email</button>
                  <button type="button" disabled={documentSaving} onClick={() => redeliverDocument(document.id, "whatsapp")} className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white">WhatsApp</button>
                </div>
              </div>)}
              {!booking.serviceDocuments?.length && <p className="text-sm text-slate-400">{isArabic ? "لم تُرفع مستندات نهائية بعد." : "No final documents uploaded yet."}</p>}
            </div>
          </div>
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

