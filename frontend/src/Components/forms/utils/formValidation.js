import { get } from "./objectPath";

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

export const validateFormField = (field, value, isArabic) => {
  if (field.required && isEmpty(value)) {
    return isArabic ? "هذا الحقل مطلوب" : "This field is required";
  }

  if (isEmpty(value)) return "";

  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return isArabic ? "أدخل بريدًا إلكترونيًا صحيحًا" : "Enter a valid email address";
  }

  if (field.min !== undefined && Number(value) < Number(field.min)) {
    return isArabic
      ? `يجب ألا تقل القيمة عن ${field.min}`
      : `Value must be at least ${field.min}`;
  }

  if (field.max !== undefined && Number(value) > Number(field.max)) {
    return isArabic
      ? `يجب ألا تزيد القيمة عن ${field.max}`
      : `Value must not exceed ${field.max}`;
  }

  if (field.minLength && String(value).length < field.minLength) {
    return isArabic
      ? `يجب ألا يقل النص عن ${field.minLength} أحرف`
      : `Must be at least ${field.minLength} characters`;
  }

  if (typeof field.validate === "function") {
    const result = field.validate(value);
    if (result !== true && result) return String(result);
  }

  return "";
};

export const validateFormFields = (fields, formState, isArabic) =>
  fields.reduce((errors, field) => {
    if (!field?.name || field.type === "hidden") return errors;
    const path = field.path || (field.isSpec ? `specs.${field.name}` : field.name);
    const message = validateFormField(field, get(formState, path), isArabic);
    if (message) errors[path] = message;
    return errors;
  }, {});
