import {
  ChoosePackageStep,
  CustomerInfoStep,
  PilgrimsStep,
  ServicesStep,
  DocumentsStep,
  ReviewStep,
  PaymentStep,
  SuccessStep,
} from "./steps";

export const bookingWizardStepRegistry = {
  choose_package: ChoosePackageStep,
  customer_info: CustomerInfoStep,
  pilgrims: PilgrimsStep,
  services: ServicesStep,
   documents: DocumentsStep,
  review: ReviewStep,
  payment: PaymentStep,
  success: SuccessStep,
};

export const getBookingWizardStepComponent = (stepKey) => {
  return bookingWizardStepRegistry[stepKey] || null;
};