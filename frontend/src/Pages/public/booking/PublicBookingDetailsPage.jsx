import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// import { fetchPublicBookingById } from "../../../redux/slices/public/bookingSlice";

import DraftBookingInfoCard from "../../../Components/shared/draft-bookings/DraftBookingInfoCard";
import DraftBookingSummaryCard from "../../../Components/shared/draft-bookings/DraftBookingSummaryCard";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PublicButton from "../../../Components/shared/buttons/PublicButton";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import CustomerBookingTimeline from "../../../Components/shared/booking/CustomerBookingTimeline";
import BookingFulfillmentTimeline from "../../../Components/shared/booking/BookingFulfillmentTimeline";
import {
  fetchPublicBookingById,
  selectPublicBookingDetailsError,
  selectPublicBookingDetailsLoading,
  selectPublicFinalBooking,
} from "../../../redux/public/bookingSlice";
import DraftSelectedProductsCard from "../../../Components/shared/draft-bookings/DraftSelectedProductsCard";
import { getNationalityLabel } from "../../../Utils/nationality";
import { formatDate } from "../../../Utils/dateUtils";
import { formatPrice } from "../../../Utils/roundPrice";
import {
  buildTravelerFullName,
  formatGenderLabel,
  getBookingTotal,
} from "../../../Utils/bookingDisplay";
import { apiSubmitBookingFulfillmentAction } from "../../../services/api/public/bookingApi";
import AttachmentPreviewCard from "../../../Components/shared/attachments/AttachmentPreviewCard";

export default function PublicBookingDetailsPage() {
  const { bookingId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const finalBooking = useSelector(selectPublicFinalBooking);
  const loading = useSelector(selectPublicBookingDetailsLoading);
  const error = useSelector(selectPublicBookingDetailsError);
  const [actionNote, setActionNote] = useState("");
  const [actionFiles, setActionFiles] = useState([]);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const submitRequiredAction = async () => {
    if (!actionNote.trim() && !actionFiles.length) return;
    setActionSubmitting(true);
    setActionError("");
    try {
      await apiSubmitBookingFulfillmentAction({
        bookingId,
        note: actionNote,
        files: actionFiles,
      });
      setActionNote("");
      setActionFiles([]);
      await dispatch(fetchPublicBookingById(bookingId));
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || requestError.message || t("actionSubmitFailed", "تعذر إرسال المطلوب"));
    } finally {
      setActionSubmitting(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchPublicBookingById(bookingId));
    }
  }, [dispatch, bookingId]);

  const programName = useMemo(() => {
    if (!finalBooking?.program) return "-";

    return isArabic
      ? finalBooking.program.nameAr || finalBooking.program.nameEn
      : finalBooking.program.nameEn || finalBooking.program.nameAr;
  }, [finalBooking, isArabic]);

  if (!loading && !finalBooking) {
    return (
      <PublicPageLayout containerClassName="max-w-6xl">
          <PageHeader
            eyebrowAr="تفاصيل الحجز"
            eyebrowEn="Booking Details"
            titleAr="الحجز غير موجود"
            titleEn="Booking Not Found"
            subtitleAr="لم يتم العثور على بيانات هذا الحجز."
            subtitleEn="No booking data was found."
          />
<BookingProgressTimeline
  currentStep="success"
  isArabic={isArabic}
/>
          
          <ErrorOverlay show={Boolean(error)} message={error} />
      </PublicPageLayout>
    );
  }

  const travelers = finalBooking?.pilgrims || finalBooking?.travelers || [];

  const customerItems = [
    {
      label: t("customerName", "اسم العميل"),
      value: finalBooking?.customer?.name,
    },
    {
      label: t("phone", "رقم الجوال"),
      value: finalBooking?.customer?.phone,
    },
    {
      label: t("email", "البريد الإلكتروني"),
      value: finalBooking?.customer?.email,
    },
    {
      label: t("nationality", "الجنسية"),
      value: getNationalityLabel(
        finalBooking?.customer?.nationality,
        isArabic,
      ),
    },
  ];

  const programItems = [
    {
      label: t("program", "البرنامج"),
      value: programName,
    },
    {
      label: t("startDate", "تاريخ البداية"),
      value: formatDate(finalBooking?.program?.startDate, { isArabic }),
    },
    {
      label: t("endDate", "تاريخ النهاية"),
      value: formatDate(finalBooking?.program?.endDate, { isArabic }),
    },
  ];

  const currency = finalBooking?.pricing?.currency || "SAR";
  const subtotal = Number(finalBooking?.pricing?.subtotal || 0);
  const taxRate = Number(finalBooking?.pricing?.taxRate || 15);
  const taxAmount = Number(
    finalBooking?.pricing?.taxAmount ||
      finalBooking?.pricing?.tax ||
      0,
  );

  const summaryRows = [
    {
      label: t("bookingNumber", "رقم الحجز"),
      value: finalBooking?.bookingNumber || finalBooking?._id,
    },
    {
      label: t("bookingStatus", "حالة الحجز"),
      value: finalBooking?.bookingStatus || finalBooking?.status || "-",
    },
    {
      label: t("paymentStatus", "حالة الدفع"),
      value: finalBooking?.paymentStatus || "-",
    },
    {
      label: t("travelersCount", "عدد المعتمرين"),
      value: travelers.length,
    },
    {
      label: t("subtotal", "الإجمالي قبل الضريبة"),
      value: formatPrice(subtotal, currency),
    },
    {
      label: t("vat", `ضريبة القيمة المضافة ${taxRate}%`),
      value: formatPrice(taxAmount, currency),
    },
    {
      label: t("totalWithVat", "الإجمالي شامل الضريبة"),
      value: formatPrice(getBookingTotal(finalBooking), currency),
    },
  ];
  const selectedProductsList =
    finalBooking?.data?.selectedProducts ||
    finalBooking?.data?.selectedProductsList ||
    [];
  return (
    <PublicPageLayout containerClassName="max-w-6xl">
        <PageHeader
          eyebrowAr="تفاصيل الحجز"
          eyebrowEn="Booking Details"
          titleAr={finalBooking?.bookingNumber || "تفاصيل الحجز"}
          titleEn={finalBooking?.bookingNumber || "Booking Details"}
          subtitleAr="هذه الصفحة تعرض بيانات الحجز الحالية كما هي محفوظة في النظام."
          subtitleEn="This page shows the current booking data saved in the system."
          actions={
            <PublicButton
              variant="secondary"
              onClick={() => navigate("/my-bookings")}
            >
              {t("backToMyBookings", "العودة لحجوزاتي")}
            </PublicButton>
          }
        >
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge
              value={
                finalBooking?.bookingStatus || finalBooking?.status || "draft"
              }
            />

            <StatusBadge
              value={finalBooking?.paymentStatus || "pending"}
              type="payment"
            />
          </div>
        </PageHeader>

        {loading && <LoadingOverlay show overlay={false} size="sm" />}

        <ErrorOverlay show={!loading && Boolean(error)} message={error} />

        {!loading && !error && finalBooking && (
          <div className="space-y-6">
            <PublicSectionCard title={t("bookingAndPaymentStatus", "حالة الحجز والدفع")}>
              <CustomerBookingTimeline
                bookingStatus={finalBooking.bookingStatus}
                paymentStatus={finalBooking.paymentStatus}
                isArabic={isArabic}
              />
            </PublicSectionCard>
            <PublicSectionCard title={t("serviceFulfillment", "تنفيذ الخدمة")}>
              <BookingFulfillmentTimeline
                fulfillment={finalBooking.fulfillment}
                serviceType={finalBooking.serviceType}
                isArabic={isArabic}
              />
              {finalBooking.fulfillment?.status === "action_required" && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-950">
                    {t("customerActionRequired", "مطلوب منك إجراء")}
                  </h3>
                  <p className="mt-1 text-sm text-amber-900">
                    {finalBooking.fulfillment.actionRequiredReason}
                  </p>
                  <textarea
                    value={actionNote}
                    onChange={(event) => setActionNote(event.target.value)}
                    placeholder={t("actionResponseNote", "أضف ملاحظة للإدارة")}
                    className="mt-4 min-h-24 w-full rounded-xl border border-amber-200 bg-white p-3"
                  />
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(event) => setActionFiles(Array.from(event.target.files || []))}
                    className="mt-3 block w-full rounded-lg border border-amber-200 bg-white p-2"
                  />
                  {actionError && <p className="mt-2 text-sm font-semibold text-rose-600">{actionError}</p>}
                  <button
                    type="button"
                    disabled={actionSubmitting || (!actionNote.trim() && !actionFiles.length)}
                    onClick={submitRequiredAction}
                    className="mt-3 rounded-lg bg-amber-600 px-5 py-2 font-bold text-white disabled:opacity-50"
                  >
                    {actionSubmitting ? t("sending", "جارٍ الإرسال...") : t("submitRequiredAction", "إرسال المطلوب")}
                  </button>
                </div>
              )}
            </PublicSectionCard>
            <PublicSectionCard title={t("deliveredDocuments", "المستندات والتذاكر المستلمة")}>
              {finalBooking.serviceDocuments?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {finalBooking.serviceDocuments.map((document) => (
                    <div key={document.id} className="rounded-xl border border-slate-200 p-3">
                      <AttachmentPreviewCard
                        label={(isArabic ? document.titleAr : document.titleEn) || document.originalName}
                        value={document.url}
                        isArabic={isArabic}
                      />
                      {document.note && <p className="mt-2 text-sm text-slate-600">{document.note}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t("noDeliveredDocuments", "لم يتم تسليم مستندات نهائية بعد.")}</p>
              )}
            </PublicSectionCard>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
              <DraftBookingInfoCard
                title={t("customerInfo", "بيانات العميل")}
                items={customerItems}
              />

              <DraftBookingInfoCard
                title={t("programInfo", "بيانات البرنامج")}
                items={programItems}
              />

              <PublicSectionCard title={t("travelers", "المعتمرون")}>
                {travelers.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t("noTravelersFound", "لا توجد بيانات معتمرين")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {travelers.map((traveler, index) => (
                      <DraftBookingInfoCard
                        key={traveler._id || index}
                        title={`${t("traveler", "معتمر")} ${index + 1}`}
                        items={buildTravelerItems({ traveler, t, isArabic })}
                      />
                    ))}
                  </div>
                )}
              </PublicSectionCard>
            </main>

            <DraftBookingSummaryCard
              title={t("bookingSummary", "ملخص الحجز")}
              rows={summaryRows}
              note={t(
                "bookingDetailsNote",
                "هذه الصفحة تعرض بيانات الحجز الحالية كما هي محفوظة في النظام.",
              )}
            />
            <DraftSelectedProductsCard
              title={t("selectedServices", "الخدمات المختارة")}
              items={selectedProductsList}
              isArabic={isArabic}
            />
          </div>
          </div>
        )}
    </PublicPageLayout>
  );
}

function buildTravelerItems({ traveler, t, isArabic }) {
  return [
    {
      label: t("fullName", "الاسم الكامل"),
      value: traveler.fullName || buildTravelerFullName(traveler),
    },
    {
      label: t("passportNumber", "رقم الجواز"),
      value: traveler.passportNumber,
    },
    {
      label: t("nationality", "الجنسية"),
      value: getNationalityLabel(traveler.nationality, isArabic),
    },
    {
      label: t("birthDate", "تاريخ الميلاد"),
      value: formatDate(traveler.birthDate, { isArabic }),
    },
    {
      label: t("gender", "الجنس"),
      value: formatGenderLabel(traveler.gender, t),
    },
  ];
}
