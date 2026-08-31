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
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PublicButton from "../../../Components/shared/buttons/PublicButton";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
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

export default function PublicBookingDetailsPage() {
  const { bookingId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const finalBooking = useSelector(selectPublicFinalBooking);
  const loading = useSelector(selectPublicBookingDetailsLoading);
  const error = useSelector(selectPublicBookingDetailsError);

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
