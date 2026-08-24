import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  fetchPublicProgramById,
  clearSelectedProgram,
} from "../../../redux/public/programSlice";
import {
  createPublicDraftBooking,
  resetPublicBooking,
} from "../../../redux/public/bookingSlice";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PublicButton from "../../../Components/shared/buttons/PublicButton";

const pendingReadyDrafts = new Map();

const buildReadyPackageDraftPayload = (program) => ({
  program: {
    programId: program?._id || program?.id || null,
    nameAr: program?.nameAr || program?.name?.ar || "",
    nameEn: program?.nameEn || program?.name?.en || "",
    startDate: program?.startDate || null,
    endDate: program?.endDate || null,
  },
  currentStep: "customer_info",
  data: {
    packageType: "READY_PACKAGE",
    selectedPackage: program,
    selectedProducts: [],
  },
});

const createReadyPackageDraftOnce = ({ dispatch, program }) => {
  const programId = String(program?._id || program?.id || "");
  if (!programId) return Promise.reject(new Error("Program ID is required"));

  const pendingCreation = pendingReadyDrafts.get(programId);
  if (pendingCreation) return pendingCreation;

  const creation = dispatch(
    createPublicDraftBooking(buildReadyPackageDraftPayload(program)),
  ).unwrap();

  pendingReadyDrafts.set(programId, creation);
  creation.then(
    () => window.setTimeout(() => pendingReadyDrafts.delete(programId), 15000),
    () => pendingReadyDrafts.delete(programId),
  );

  return creation;
};

export default function PublicBookingPage() {
  const { programId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const creationStartedRef = useRef(false);
  const [creationError, setCreationError] = useState("");

  const { selectedProgram, detailsLoading, error: programError } = useSelector(
    (state) => state.publicPrograms,
  );
  const { submitLoading, error: bookingError } = useSelector(
    (state) => state.publicBooking,
  );

  useEffect(() => {
    dispatch(resetPublicBooking());
    if (programId) dispatch(fetchPublicProgramById(programId));

    return () => dispatch(clearSelectedProgram());
  }, [dispatch, programId]);

  const enterDraft = useCallback(async () => {
    const selectedProgramId = String(selectedProgram?._id || selectedProgram?.id || "");
    if (!selectedProgramId || selectedProgramId !== String(programId)) return;
    if (creationStartedRef.current) return;

    creationStartedRef.current = true;
    setCreationError("");

    try {
      const result = await createReadyPackageDraftOnce({
        dispatch,
        program: selectedProgram,
      });
      const draftId = result?.data?._id || result?._id;

      if (!draftId) {
        throw new Error(
          t("draftIdNotReturned", "لم يتم استلام رقم مسودة الحجز."),
        );
      }

      navigate(`/booking/draft/${draftId}/details`, { replace: true });
    } catch (createError) {
      creationStartedRef.current = false;
      setCreationError(
        createError?.message ||
          createError ||
          t("readyDraftCreateFailed", "تعذر بدء حجز البرنامج الجاهز."),
      );
    }
  }, [dispatch, navigate, programId, selectedProgram, t]);

  useEffect(() => {
    enterDraft();
  }, [enterDraft]);

  const displayError = creationError || bookingError || programError;
  const handleRetry = () => {
    if (!selectedProgram && programId) {
      dispatch(fetchPublicProgramById(programId));
      return;
    }

    enterDraft();
  };

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="برنامج جاهز"
        eyebrowEn="Ready Package"
        titleAr="بدء الحجز"
        titleEn="Starting Your Booking"
        subtitleAr="يتم الآن تجهيز مسودة الحجز للانتقال إلى بيانات العميل والمعتمرين."
        subtitleEn="Preparing your booking draft before entering customer and traveler details."
      />

      <ErrorOverlay show={Boolean(displayError)} message={displayError} />

      {!displayError && (detailsLoading || submitLoading || !selectedProgram) && (
        <Loader />
      )}

      {displayError && (
        <div className="mt-6 flex justify-center gap-3">
          <PublicButton onClick={handleRetry} loading={submitLoading || detailsLoading}>
            {t("retry", "إعادة المحاولة")}
          </PublicButton>
          <PublicButton
            variant="secondary"
            onClick={() => navigate(`/programs/${programId}`)}
          >
            {t("backToProgram", "العودة إلى البرنامج")}
          </PublicButton>
        </div>
      )}
    </PublicPageLayout>
  );
}
