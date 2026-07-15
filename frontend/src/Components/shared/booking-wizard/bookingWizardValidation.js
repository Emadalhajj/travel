/*
=========================================================
bookingWizardValidation
=========================================================

هذا الملف مسؤول عن التحقق من كل خطوة قبل الانتقال للخطوة التالية.

مهم:
لا يحتوي على UI.
لا يستدعي API.
لا يتعامل مع Redux.
فقط يستقبل بيانات الحجز ويرجع نتيجة التحقق.
=========================================================
*/

export const validateBookingWizardStep = (stepKey, bookingState = {}) => {
  const errors = {};

  switch (stepKey) {
    case "choose_package": {
      if (!bookingState.selectedPackage) {
        errors.selectedPackage = "يرجى اختيار برنامج العمرة أولاً";
      }

      break;
    }

    case "customer_info": {
      if (!bookingState.customer?.name?.trim()) {
        errors.name = "اسم العميل مطلوب";
      }

      if (!bookingState.customer?.phone?.trim()) {
        errors.phone = "رقم الجوال مطلوب";
      }

      break;
    }

    case "pilgrims": {
      if (!bookingState.travelers?.length) {
        errors.travelers = "يرجى إضافة معتمر واحد على الأقل";
      }

      bookingState.travelers?.forEach((traveler, index) => {
        if (!traveler.fullName?.trim()) {
          errors[`travelers.${index}.fullName`] = "اسم المعتمر مطلوب";
        }

        if (!traveler.passportNumber?.trim()) {
          errors[`travelers.${index}.passportNumber`] = "رقم الجواز مطلوب";
        }
      });

      break;
    }

    case "services": {
      break;
    }
    case "documents": {
  break;
}

    case "review": {
      break;
    }

    case "payment": {
      if (!bookingState.payment?.paymentMethod) {
        errors.paymentMethod = "طريقة الدفع مطلوبة";
      }

      break;
    }

    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};