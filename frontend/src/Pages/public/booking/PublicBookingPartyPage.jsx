import { useEffect } from "react";
import { Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PageHeader from "../../../Components/layout/PageHeader";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import BookingProgressTimeline, {
  customPackageSteps,
} from "../../../Components/shared/booking/BookingProgressTimeline";
import BookingPartyDetailsForm from "../../../Components/shared/booking/BookingPartyDetailsForm";
import BookingWizardNavigation from "../../../Components/shared/booking-wizard/BookingWizardNavigation";
import {
  ensurePublicDraftBooking,
  selectPublicBookingSubmitLoading,
  selectPublicDraftBooking,
  selectPublicDraftError,
  selectPublicDraftLoading,
} from "../../../redux/public/bookingSlice";
import useDraftBookingPartyForm from "../../../hooks/public-booking/useDraftBookingPartyForm";
import { isRequirementVisible } from
  "../../../config/public-booking/bookingRequirements";

export default function PublicBookingPartyPage() {
  const { draftId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const draftBooking = useSelector(selectPublicDraftBooking);
  const loading = useSelector(selectPublicDraftLoading);
  const submitLoading = useSelector(selectPublicBookingSubmitLoading);
  const error = useSelector(selectPublicDraftError);

  const party = useDraftBookingPartyForm({
    draftId,
    draftBooking,
    submitLoading,
    isArabic,
  });

  useEffect(() => {
    if (draftId) dispatch(ensurePublicDraftBooking(draftId));
  }, [dispatch, draftId]);

  const handleBack = () => {
    if (party.isExternalFlight) {
      navigate("/services/flights");
      return;
    }
    const serviceRoutes = {
      HOTEL: "/services/hotels",
      ACCOMMODATION: "/services/hotels",
      TRANSPORT: "/services/transports",
      VISA: "/services/visas",
      ZIYARAT: "/services/ziyarats",
      EXTRA_SERVICE: "/services/extras",
    };
    if (serviceRoutes[party.serviceType]) {
      const route = serviceRoutes[party.serviceType];
      navigate(
        party.serviceType === "ACCOMMODATION"
          ? `${route}?draftId=${encodeURIComponent(draftId)}`
          : route,
      );
      return;
    }
    const packageType = String(draftBooking?.data?.packageType || "").toUpperCase();
    const selectedPackage = draftBooking?.data?.selectedPackage;
    const programId = selectedPackage?._id || selectedPackage?.id || draftBooking?.program?.programId;

    if (packageType === "READY_PACKAGE" && programId) {
      navigate(`/programs/${programId}`);
      return;
    }

    navigate("/custom-package-builder");
  };

  const handleConfirmedSave = async () => {
    const saved = await party.savePartyDetails();
    if (saved) navigate(`/draft-booking/${draftId}`);
  };

  if (loading) {
    return (
      <PublicPageLayout>
        <LoadingOverlay show overlay={false} />
      </PublicPageLayout>
    );
  }
  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="تفاصيل الحجز"
        eyebrowEn="Booking Details"
        titleAr={party.bookingType === "UMRAH"
          ? "بيانات العميل والمعتمرين"
          : isRequirementVisible(party.requirements.travelers)
            ? "بيانات المسافرين"
            : "بيانات الحجز"}
        titleEn={party.bookingType === "UMRAH" ? "Customer and Travelers" : "Travelers"}
        subtitleAr={party.bookingType === "UMRAH"
          ? "أكمل بيانات العميل والمعتمرين والمستضيفين ثم انتقل للمراجعة."
          : "أكمل فقط البيانات المطلوبة لهذه الخدمة ثم انتقل للمراجعة."}
        subtitleEn={party.bookingType === "UMRAH"
          ? "Complete customer, traveler, and host details, then continue to review."
          : "Complete only the details required for this service, then continue to review."}
      />

      <BookingProgressTimeline
        currentStep="customer_info"
        isArabic={isArabic}
        steps={customPackageSteps}
      />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <ErrorOverlay show={Boolean(party.localError)} message={party.localError} />

      <PublicSectionCard>
        <BookingPartyDetailsForm
          customer={party.customer}
          travelers={party.travelers}
          hosts={party.hosts}
          onHostsChange={party.handleHostsChange}
          onCustomerChange={party.handleCustomerChange}
          onTravelerChange={party.handleTravelerChange}
          onAddTraveler={party.addTraveler}
          onRemoveTraveler={party.removeTraveler}
          canAddTraveler={party.canAddTraveler}
          errors={party.errors}
          isArabic={isArabic}
          isExternalFlight={party.isExternalFlight}
          requirements={party.requirements}
        />

        {isRequirementVisible(party.requirements.travelers) && party.availableSeats !== null && !party.canAddTraveler && (
          <Alert variant="warning" className="mt-5 mb-0 rounded-4">
            <p className="mb-1 fw-semibold">
              {t(
                "readyPackageCapacityReached",
                "لا يمكن إضافة معتمر جديد لأن السعة المتاحة للبرنامج وصلت إلى الحد الأقصى.",
              )}
            </p>
            <p className="mb-0 small">
              {t("availableCapacity", "السعة المتاحة")}: {party.availableSeats}
              {" — "}
              {party.bookingType === "UMRAH"
                ? t("currentTravelersCount", "عدد المعتمرين الحالي")
                : t("currentTravelersCount", "عدد المسافرين الحالي")}: {party.travelersCount}
            </p>
          </Alert>
        )}

        <div className="mt-8">
          <BookingWizardNavigation
            onBack={handleBack}
            onNext={party.requestSaveConfirmation}
            disabled={party.saving}
            loading={party.saving}
            backLabel={isArabic ? "رجوع" : "Back"}
            nextLabel={party.uploading
              ? (isArabic ? "جاري رفع المرفقات..." : "Uploading attachments...")
              : (isArabic ? "حفظ والانتقال للمراجعة" : "Save and review")}
          />
        </div>
      </PublicSectionCard>

      <ConfirmDialog
        show={party.showSaveConfirmation}
        onHide={party.closeSaveConfirmation}
        onConfirm={handleConfirmedSave}
        title={isArabic ? "تأكيد حفظ المسودة" : "Confirm draft save"}
        message={isArabic ? "هل تريد حفظ البيانات الحالية والانتقال إلى مراجعة المسودة؟" : "Save the current data and continue to draft review?"}
        confirmText={isArabic ? "نعم، حفظ ومتابعة" : "Save and continue"}
        cancelText={isArabic ? "العودة للنموذج" : "Back to form"}
        variant="success"
        loading={party.saving}
      />
    </PublicPageLayout>
  );
}
