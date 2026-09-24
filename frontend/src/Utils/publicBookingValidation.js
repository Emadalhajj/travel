import {
  BOOKING_REQUIREMENTS,
  isRequirementRequired,
  isRequirementVisible,
} from "../config/public-booking/bookingRequirements";
import { validatePassengerAge } from "./travelers/passengerAge";

const PHONE_REGEX = /^\+?\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const hasValue = (value) => String(value ?? "").trim().length > 0;

export const validateBookingParty = ({
  customer = {},
  travelers = [],
  hosts = [],
  isArabic = true,
  partyMode = "UMRAH",
  requirements,
  travelStartsAt = null,
  travelEndsAt = null,
}) => {
  const errors = {};
  const required = isArabic ? "هذا الحقل مطلوب" : "This field is required";
  const activeRequirements =
    requirements ||
    (partyMode === "BASIC"
      ? BOOKING_REQUIREMENTS.TRANSPORT
      : BOOKING_REQUIREMENTS[partyMode]) ||
    BOOKING_REQUIREMENTS.UMRAH;

  if (isRequirementVisible(activeRequirements.customer)) {
    ["name", "phone", "email", "nationality"].forEach((field) => {
      if (!hasValue(customer[field])) errors[`customer.${field}`] = required;
    });
  }

  if (customer.phone && !PHONE_REGEX.test(String(customer.phone).trim())) {
    errors["customer.phone"] = isArabic
      ? "رقم الجوال يجب أن يتكون من 7 إلى 15 رقمًا دون حروف"
      : "Phone number must contain 7 to 15 digits without letters";
  }

  if (customer.email && !EMAIL_REGEX.test(String(customer.email).trim())) {
    errors["customer.email"] = isArabic
      ? "يرجى إدخال بريد إلكتروني صحيح، مثال: name@example.com"
      : "Enter a valid email address, for example: name@example.com";
  }

  if (
    isRequirementRequired(activeRequirements.travelers) &&
    travelers.length === 0
  ) {
    errors.travelers = isArabic
      ? "يجب إضافة مسافر واحد على الأقل"
      : "Add at least one traveler";
  }

  if (isRequirementVisible(activeRequirements.travelers))
    travelers.forEach((traveler, index) => {
      Object.entries(activeRequirements.travelerFields || {}).forEach(
        ([field, fieldRequired]) => {
          if (
            !isRequirementRequired(fieldRequired) ||
            field === "responsibleAdultTravelerId" ||
            field === "passengerType"
          )
            return;
          if (!hasValue(traveler[field]))
            errors[`travelers.${index}.${field}`] = required;
        },
      );

      if (isRequirementVisible(activeRequirements.travelerFields?.email)) {
        if (
          traveler.email &&
          !EMAIL_REGEX.test(String(traveler.email).trim())
        ) {
          errors[`travelers.${index}.email`] = isArabic
            ? "البريد الإلكتروني غير صالح"
            : "Invalid email address";
        }
      }
      if (
        isRequirementVisible(activeRequirements.travelerFields?.phoneNumber)
      ) {
        if (
          traveler.phoneNumber &&
          !PHONE_REGEX.test(String(traveler.phoneNumber).trim())
        ) {
          errors[`travelers.${index}.phoneNumber`] = isArabic
            ? "رقم التواصل غير صالح"
            : "Invalid contact number";
        }
        if (
          activeRequirements.travelerFields?.responsibleAdultTravelerId
            ?.systemManaged &&
          traveler.passengerCategory === "infant_without_seat" &&
          !hasValue(traveler.responsibleAdultTravelerId)
        ) {
          errors[`travelers.${index}.responsibleAdultTravelerId`] = required;
        }
      }

      if (
        travelStartsAt &&
        traveler.birthDate &&
        activeRequirements.travelerFields?.passengerType?.systemManaged
      ) {
        const ageValidation = validatePassengerAge({
          passengerType: traveler.passengerCategory,
          birthDate: traveler.birthDate,
          travelDate: travelStartsAt,
        });
        if (!ageValidation.valid) {
          const typeLabels = isArabic
            ? { adult: "بالغ", child: "طفل", infant_without_seat: "رضيع" }
            : { adult: "adult", child: "child", infant_without_seat: "infant" };
          const ageRanges = isArabic
            ? {
                adult: "يجب أن يكون عمره 12 سنة أو أكثر",
                child: "يجب أن يكون عمره من سنتين إلى أقل من 12 سنة",
                infant_without_seat: "يجب أن يكون عمره أقل من سنتين",
              }
            : {
                adult: "The passenger must be at least 12 years old",
                child:
                  "The passenger must be at least 2 and under 12 years old",
                infant_without_seat: "The passenger must be under 2 years old",
              };
          errors[`travelers.${index}.birthDate`] = isArabic
            ? `تاريخ الميلاد لا يتوافق مع نوع الراكب «${typeLabels[traveler.passengerCategory] || traveler.passengerCategory}» في تاريخ السفر. ${ageRanges[traveler.passengerCategory] || ""}`
            : `Birth date does not match the ${typeLabels[traveler.passengerCategory] || traveler.passengerCategory} passenger type on the travel date. ${ageRanges[traveler.passengerCategory] || ""}`;
        }
      }

      if (
        isRequirementVisible(
          activeRequirements.travelerFields?.passportExpiryDate,
        ) &&
        traveler.passportExpiryDate &&
        travelEndsAt &&
        new Date(traveler.passportExpiryDate) < new Date(travelEndsAt)
      ) {
        errors[`travelers.${index}.passportExpiryDate`] = isArabic
          ? "يجب أن يبقى جواز السفر صالحًا حتى نهاية الرحلة"
          : "The passport must remain valid through the end of the trip";
      }

      if (
        activeRequirements.documents?.passport?.required &&
        !traveler.passportImage &&
        !traveler.passportFiles?.length
      ) {
        errors[`travelers.${index}.passportFiles`] = isArabic
          ? "صورة الجواز مطلوبة"
          : "Passport copy is required";
      }
      if (
        activeRequirements.documents?.personalPhoto?.required &&
        !traveler.personalPhoto &&
        !traveler.personalPhotoFiles?.length
      ) {
        errors[`travelers.${index}.personalPhotoFiles`] = isArabic
          ? "الصورة الشخصية مطلوبة"
          : "Personal photo is required";
      }
      if (
        activeRequirements.documents?.vaccinationCertificate?.required &&
        !traveler.vaccinationCertificate &&
        !traveler.vaccinationCertificateFiles?.length
      ) {
        errors[`travelers.${index}.vaccinationCertificateFiles`] = required;
      }
      if (
        activeRequirements.documents?.visaAttachment?.required &&
        !traveler.visaAttachment &&
        !traveler.visaAttachmentFiles?.length
      ) {
        errors[`travelers.${index}.visaAttachmentFiles`] = required;
      }

      if (
        traveler.whatsapp &&
        !PHONE_REGEX.test(String(traveler.whatsapp).trim())
      ) {
        errors[`travelers.${index}.whatsapp`] = isArabic
          ? "رقم التواصل يجب أن يتكون من 7 إلى 15 رقمًا"
          : "Contact number must contain 7 to 15 digits";
      }
    });

  if (!isRequirementVisible(activeRequirements.hosts)) return errors;

  const nationalIds = new Set();
  hosts.forEach((host, index) => {
    ["name", "nationalId", "phone", "birthDate", "nationalAddress"].forEach(
      (field) => {
        if (!hasValue(host[field]))
          errors[`hosts.${index}.${field}`] = required;
      },
    );

    if (host.phone && !PHONE_REGEX.test(String(host.phone).trim())) {
      errors[`hosts.${index}.phone`] = isArabic
        ? "رقم الجوال غير صالح"
        : "Invalid phone number";
    }
    if (!host.idImage && !host.idFiles?.length) {
      errors[`hosts.${index}.idFiles`] = isArabic
        ? "صورة الهوية أو الإقامة مطلوبة"
        : "National ID or residence copy is required";
    }
    if (!host.nationalAddressImage && !host.nationalAddressFiles?.length) {
      errors[`hosts.${index}.nationalAddressFiles`] = isArabic
        ? "صورة العنوان الوطني مطلوبة"
        : "National address copy is required";
    }

    const nationalId = String(host.nationalId ?? "").trim();
    if (nationalId && nationalIds.has(nationalId)) {
      errors[`hosts.${index}.nationalId`] = isArabic
        ? "لا يمكن تكرار نفس المستضيف"
        : "The same host cannot be added twice";
    }
    if (nationalId) nationalIds.add(nationalId);
  });

  return errors;
};
