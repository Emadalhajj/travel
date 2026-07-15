/*
وهو المكون الأب الذي يجمع:

BookingWizardSteps
BookingWizardNavigation
محتوى الخطوة الحالية

نربط الـ Context مع الـ Wizard نفس
ه، بحيث يصبح BookingWizard.jsx هو المسؤول عن عرض الخطوة الحالية فقط，
 بينما البيانات تأتي من BookingProvider. هذا يجعل الصفحة جاهزة لاحقًا لربط DraftBooking بدون تضخيمها.
*/
import BookingWizardSteps from "./BookingWizardSteps";
import BookingWizardNavigation from "./BookingWizardNavigation";
// import useBookingWizard from "../../../../hooks/public-booking/useBookingWizard";
import useBooking from "./context/useBooking";


import useBookingWizard from "./useBookingWizard";
import useAutoSaveDraftBooking from "../../../hooks/public-booking/useAutoSaveDraftBooking";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getBookingWizardStepComponent } from "./stepRegistry";

export default function BookingWizard({
  packages = [],
  products = {},
  packagesLoading = false,
  packagesError = null,
  initialPackage = null,
}) {
  const {
    steps,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    goToStep,
    goToStepByKey,
  } = useBookingWizard();

  const {
    selectedPackage,
    selectPackage,
    selectedProducts,
    addProduct,
    removeProduct,
    finalBooking,
    draftBooking,
    submitLoading,
    error,
    syncDraftBooking,
    completeCurrentDraft,
    resetBooking,
    validateStep,
    documents,
    customer,
    travelers,
    pricing,
    payment,
    loadDraftBooking,
  } = useBooking();
  //
  const { draftId: routeDraftId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdFromUrl = routeDraftId || searchParams.get("draftId");
  const initialPackageAppliedRef = useRef(false);

  const updateUrlWithDraftId = (draft) => {
    const draftId = draft?._id || draft?.id;

    if (!draftId) return;
    if (draftIdFromUrl === draftId) return;

    setSearchParams({
      draftId,
    });
  };

  const loadedDraftRef = useRef(false);

  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

  useEffect(() => {
    if (!draftIdFromUrl) {
      setIsDraftHydrated(true);
      return;
    }

    if (loadedDraftRef.current) return;

    loadedDraftRef.current = true;

    const loadDraft = async () => {
      try {
        const draft = await loadDraftBooking(draftIdFromUrl);

        if (draft?.currentStep) {
          goToStepByKey(draft.currentStep);
        }

        setIsDraftHydrated(true);
      } catch (error) {
        console.error("Failed to load draft booking", error);
        setIsDraftHydrated(true);
      }
    };

    loadDraft();
  }, [draftIdFromUrl]);

  useEffect(() => {
    if (!initialPackage || initialPackageAppliedRef.current || draftIdFromUrl) {
      return;
    }

    initialPackageAppliedRef.current = true;
    selectPackage(initialPackage);
    goToStepByKey("customer_info");
  }, [initialPackage, draftIdFromUrl, selectPackage, goToStepByKey]);
  
  useAutoSaveDraftBooking({
    enabled: Boolean(isDraftHydrated && (draftBooking?._id || draftBooking?.id)),
    currentStepKey: currentStep.key,
    selectedPackage,
    draftBooking,
    submitLoading,
    syncDraftBooking,
    dependencies: [
      customer,
      travelers,
      selectedProducts,
      pricing,
      payment,
      documents,
    ],
    delay: 1200,
  });
  const handleSelectPackage = async (program) => {
    selectPackage(program);
    goNext();
  };

  const handleNext = async () => {
    try {
      if (currentStep.key === "success") return;

      const isValid = validateStep(currentStep.key);
      if (!isValid) return;

      if (currentStep.key === "payment") {
        const savedDraft = await syncDraftBooking("payment");
        updateUrlWithDraftId(savedDraft);

        await completeCurrentDraft();
        goNext();
        return;
      }

      const nextStep = steps[currentStepIndex + 1];

      const savedDraft = await syncDraftBooking(
        nextStep?.key || currentStep.key,
      );
      updateUrlWithDraftId(savedDraft);

      goNext();
    } catch (err) {
      console.error("Booking wizard next error:", err);
    }
  };

  const getNextLabel = () => {
    if (currentStep.key === "payment") {
      return submitLoading ? "جاري تأكيد الحجز..." : "تأكيد الحجز";
    }

    return submitLoading ? "جاري الحفظ..." : "التالي";
  };

const renderCurrentStep = () => {
  const StepComponent = getBookingWizardStepComponent(currentStep.key);

  if (!StepComponent) return null;

  const commonProps = {
    packages,
    products,
    packagesLoading,
    packagesError,
    selectedPackage,
    selectedProducts,
    onSelectPackage: handleSelectPackage,
    onAddProduct: addProduct,
    onRemoveProduct: removeProduct,
  };

  return <StepComponent {...commonProps} />;
};

  return (
    <div className="space-y-6">
      <BookingWizardSteps
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={goToStep}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      <div>{renderCurrentStep()}</div>

      <BookingWizardNavigation
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onBack={goBack}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        disabled={submitLoading}
      />
    </div>
  );
}
