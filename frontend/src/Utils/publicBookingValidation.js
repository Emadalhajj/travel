const PHONE_REGEX = /^\+?\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const hasValue = (value) => String(value ?? "").trim().length > 0;

export const validateBookingParty = ({
  customer = {},
  travelers = [],
  hosts = [],
  isArabic = true,
}) => {
  const errors = {};
  const required = isArabic ? "هذا الحقل مطلوب" : "This field is required";

  ["name", "phone", "email", "nationality"].forEach((field) => {
    if (!hasValue(customer[field])) errors[`customer.${field}`] = required;
  });

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

  travelers.forEach((traveler, index) => {
    ["fullName", "passportNumber", "nationality", "birthDate"].forEach((field) => {
      if (!hasValue(traveler[field])) errors[`travelers.${index}.${field}`] = required;
    });

    if (!traveler.passportImage && !traveler.passportFiles?.length) {
      errors[`travelers.${index}.passportFiles`] = isArabic
        ? "صورة الجواز مطلوبة"
        : "Passport copy is required";
    }

    if (traveler.whatsapp && !PHONE_REGEX.test(String(traveler.whatsapp).trim())) {
      errors[`travelers.${index}.whatsapp`] = isArabic
        ? "رقم التواصل يجب أن يتكون من 7 إلى 15 رقمًا"
        : "Contact number must contain 7 to 15 digits";
    }
  });

  const nationalIds = new Set();
  hosts.forEach((host, index) => {
    ["name", "nationalId", "phone", "birthDate", "nationalAddress"].forEach((field) => {
      if (!hasValue(host[field])) errors[`hosts.${index}.${field}`] = required;
    });

    if (host.phone && !PHONE_REGEX.test(String(host.phone).trim())) {
      errors[`hosts.${index}.phone`] = isArabic ? "رقم الجوال غير صالح" : "Invalid phone number";
    }
    if (!host.idImage && !host.idFiles?.length) {
      errors[`hosts.${index}.idFiles`] = isArabic ? "صورة الهوية أو الإقامة مطلوبة" : "National ID or residence copy is required";
    }
    if (!host.nationalAddressImage && !host.nationalAddressFiles?.length) {
      errors[`hosts.${index}.nationalAddressFiles`] = isArabic ? "صورة العنوان الوطني مطلوبة" : "National address copy is required";
    }

    const nationalId = String(host.nationalId ?? "").trim();
    if (nationalId && nationalIds.has(nationalId)) {
      errors[`hosts.${index}.nationalId`] = isArabic ? "لا يمكن تكرار نفس المستضيف" : "The same host cannot be added twice";
    }
    if (nationalId) nationalIds.add(nationalId);
  });

  return errors;
};
