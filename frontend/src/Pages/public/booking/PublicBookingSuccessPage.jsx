import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import Loader from "../../../Components/common/Loader";
import PageHeader from "../../../Components/layout/PageHeader";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PublicButton from "../../../Components/shared/buttons/PublicButton";

import {
  fetchPublicBookingById,
  selectPublicBookingDetailsError,
  selectPublicBookingDetailsLoading,
  selectPublicFinalBooking,
} from "../../../redux/public/bookingSlice";
import InfoRow from "../../../Components/shared/common/InfoRow";
import { formatPrice } from "../../../Utils/roundPrice";

export default function PublicBookingSuccessPage() {
  const { bookingId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const finalBooking = useSelector(selectPublicFinalBooking);
  const loading = useSelector(selectPublicBookingDetailsLoading);
  const error = useSelector(selectPublicBookingDetailsError);

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchPublicBookingById(bookingId));
    }
  }, [dispatch, bookingId]);

  const currency = finalBooking?.pricing?.currency || "SAR";
  const subtotal = Number(finalBooking?.pricing?.subtotal || 0);
  const taxRate = Number(finalBooking?.pricing?.taxRate || 15);
  const taxAmount = Number(
    finalBooking?.pricing?.taxAmount ||
      finalBooking?.pricing?.tax ||
      0,
  );
  const total = Number(
    finalBooking?.pricing?.totalPrice ||
      finalBooking?.pricing?.total ||
      finalBooking?.pricing?.totalAmount ||
      0,
  );

  return (
    <PublicPageLayout containerClassName="max-w-4xl">
        <PageHeader
          center
          eyebrowAr="تم إنشاء الحجز"
          eyebrowEn="Booking Created"
          titleAr="تم إنشاء الحجز بنجاح"
          titleEn="Booking Created Successfully"
          subtitleAr="تم تحويل المسودة إلى حجز فعلي ويمكنك متابعة الحالة من حسابك."
          subtitleEn="The draft has been converted into a booking and you can track it from your account."
        />

        {loading && <Loader />}

        <ErrorOverlay show={!loading && Boolean(error)} message={error} />

        {!loading && !error && (
          <PublicSectionCard className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
              ✓
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-start">
              <InfoRow
                label={t("bookingNumber", "رقم الحجز")}
                value={finalBooking?.bookingNumber || finalBooking?._id || bookingId}
              />

              <InfoRow
                label={t("bookingStatus", "حالة الحجز")}
                value={finalBooking?.bookingStatus || finalBooking?.status || "-"}
              />

              <InfoRow
                label={t("paymentStatus", "حالة الدفع")}
                value={finalBooking?.paymentStatus || "-"}
              />

              <InfoRow
                label={t("subtotal", "الإجمالي قبل الضريبة")}
                value={formatPrice(subtotal, currency)}
              />

              <InfoRow
                label={t("vat", `ضريبة القيمة المضافة ${taxRate}%`)}
                value={formatPrice(taxAmount, currency)}
              />

              <InfoRow
                label={t("totalWithVat", "الإجمالي شامل الضريبة")}
                value={formatPrice(total, currency)}
              />
            </div>

            <div className="mt-8 flex flex-col md:flex-row gap-3">
              <PublicButton
                fullWidth
                onClick={() => navigate("/programs")}
                className="flex-1"
              >
                {t("backToPrograms", "العودة للبرامج")}
              </PublicButton>

              <PublicButton
                fullWidth
                variant="secondary"
                onClick={() => navigate("/my-bookings")}
                className="flex-1"
              >
                {t("myBookings", "حجوزاتي")}
              </PublicButton>
            </div>
          </PublicSectionCard>
        )}
    </PublicPageLayout>
  );
}

