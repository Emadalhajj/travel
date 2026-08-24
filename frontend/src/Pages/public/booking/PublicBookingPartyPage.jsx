import { useEffect } from "react";
import { Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PageHeader from "../../../Components/layout/PageHeader";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import BookingProgressTimeline, {
  customPackageSteps,
} from "../../../Components/shared/booking/BookingProgressTimeline";
import BookingPartyDetailsForm from "../../../Components/shared/booking/BookingPartyDetailsForm";
import BookingWizardNavigation from "../../../Components/shared/booking-wizard/BookingWizardNavigation";
import { fetchPublicDraftBookingById } from "../../../redux/public/bookingSlice";
import useDraftBookingPartyForm from "../../../hooks/public-booking/useDraftBookingPartyForm";

export default function PublicBookingPartyPage() {
  const { draftId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { draftBooking, loading, submitLoading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const party = useDraftBookingPartyForm({
    draftId,
    draftBooking,
    submitLoading,
    isArabic,
  });

  useEffect(() => {
    if (draftId) dispatch(fetchPublicDraftBookingById(draftId));
  }, [dispatch, draftId]);

  const handleBack = () => {
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
    return <PublicPageLayout><Loader /></PublicPageLayout>;
  }

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="تفاصيل الحجز"
        eyebrowEn="Booking Details"
        titleAr="بيانات العميل والمعتمرين"
        titleEn="Customer and Travelers"
        subtitleAr="أكمل بيانات العميل والمعتمرين والمستضيفين ثم انتقل للمراجعة."
        subtitleEn="Complete customer, traveler, and host details, then continue to review."
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
        />

        {party.availableSeats !== null && !party.canAddTraveler && (
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
              {t("currentTravelersCount", "عدد المعتمرين الحالي")}: {party.travelersCount}
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
