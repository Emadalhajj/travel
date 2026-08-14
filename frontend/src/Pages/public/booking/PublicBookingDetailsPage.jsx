import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// import { fetchPublicBookingById } from "../../../redux/slices/public/bookingSlice";

import DraftBookingInfoCard from "../../../Components/shared/draft-bookings/DraftBookingInfoCard";
import DraftBookingSummaryCard from "../../../Components/shared/draft-bookings/DraftBookingSummaryCard";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import Loader from "../../../Components/common/Loader";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import { fetchPublicBookingById } from "../../../redux/public/bookingSlice";
import DraftSelectedProductsCard from "../../../Components/shared/draft-bookings/DraftSelectedProductsCard";
import { getNationalityLabel } from "../../../Utils/nationality";

export default function PublicBookingDetailsPage() {
  const { bookingId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { finalBooking, loading, error } = useSelector(
    (state) => state.publicBooking,
  );

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
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
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
        </div>
      </div>
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
      value: formatDate(finalBooking?.program?.startDate),
    },
    {
      label: t("endDate", "تاريخ النهاية"),
      value: formatDate(finalBooking?.program?.endDate),
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
      value: formatMoney(subtotal, currency),
    },
    {
      label: t("vat", `ضريبة القيمة المضافة ${taxRate}%`),
      value: formatMoney(taxAmount, currency),
    },
    {
      label: t("totalWithVat", "الإجمالي شامل الضريبة"),
      value: formatMoney(getBookingTotal(finalBooking), currency),
    },
  ];
  const selectedProductsList =
    finalBooking?.data?.selectedProducts ||
    finalBooking?.data?.selectedProductsList ||
    [];
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrowAr="تفاصيل الحجز"
          eyebrowEn="Booking Details"
          titleAr={finalBooking?.bookingNumber || "تفاصيل الحجز"}
          titleEn={finalBooking?.bookingNumber || "Booking Details"}
          subtitleAr="هذه الصفحة تعرض بيانات الحجز الحالية كما هي محفوظة في النظام."
          subtitleEn="This page shows the current booking data saved in the system."
          actions={
            <button
              type="button"
              onClick={() => navigate("/my-bookings")}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {t("backToMyBookings", "العودة لحجوزاتي")}
            </button>
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

        {loading && <Loader />}

        <ErrorOverlay show={!loading && Boolean(error)} message={error} />

        {!loading && !error && finalBooking && (
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

              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <h2 className="mb-5 text-xl font-bold text-slate-900">
                  {t("travelers", "المعتمرون")}
                </h2>

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
              </section>
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
        )}
      </div>
    </div>
  );
}

function buildTravelerItems({ traveler, t, isArabic }) {
  return [
    {
      label: t("fullName", "الاسم الكامل"),
      value: traveler.fullName || buildPilgrimFullName(traveler),
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
      value: formatDate(traveler.birthDate),
    },
    {
      label: t("gender", "الجنس"),
      value: formatGender(traveler.gender, t),
    },
  ];
}

function buildPilgrimFullName(pilgrim) {
  return [
    pilgrim.firstNameAr || pilgrim.firstNameEn,
    pilgrim.secondNameAr || pilgrim.secondNameEn,
    pilgrim.thirdNameAr || pilgrim.thirdNameEn,
    pilgrim.lastNameAr || pilgrim.lastNameEn,
  ]
    .filter(Boolean)
    .join(" ");
}

function getBookingTotal(booking) {
  return (
    booking?.pricing?.totalPrice ||
    booking?.pricing?.total ||
    booking?.pricing?.totalAmount ||
    0
  );
}

function formatMoney(amount, currency = "SAR") {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-CA");
}

function formatGender(value, t) {
  if (value === "male") return t("male", "ذكر");
  if (value === "female") return t("female", "أنثى");

  return "-";
}
