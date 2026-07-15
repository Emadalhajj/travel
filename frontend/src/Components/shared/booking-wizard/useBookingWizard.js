/*
وظيفته إدارة التنقل فقط، وليس بيانات الحجز.
*/
import { useMemo, useState } from "react";
import { BOOKING_WIZARD_STEPS } from "./bookingWizardStepDefinitions";

export default function useBookingWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = BOOKING_WIZARD_STEPS[currentStepIndex];

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === BOOKING_WIZARD_STEPS.length - 1;

  const goNext = () => {
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, BOOKING_WIZARD_STEPS.length - 1)
    );
  };

  const goBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= BOOKING_WIZARD_STEPS.length) return;
    setCurrentStepIndex(stepIndex);
  };

  const goToStepByKey = (stepKey) => {
    const stepIndex = BOOKING_WIZARD_STEPS.findIndex(
      (step) => step.key === stepKey
    );

    if (stepIndex === -1) return;

    setCurrentStepIndex(stepIndex);
  };

  return useMemo(
    () => ({
      steps: BOOKING_WIZARD_STEPS,
      currentStep,
      currentStepIndex,
      isFirstStep,
      isLastStep,
      goNext,
      goBack,
      goToStep,
      goToStepByKey,
    }),
    [currentStep, currentStepIndex, isFirstStep, isLastStep]
  );
}