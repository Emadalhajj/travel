const messages = Object.freeze({
  ar: Object.freeze({
    "any.required": "الحقل {{field}} مطلوب",
    "any.only": "قيمة الحقل {{field}} غير مسموحة",
    "any.invalid": "قيمة الحقل {{field}} غير صحيحة",
    "string.base": "الحقل {{field}} يجب أن يكون نصًا",
    "string.empty": "الحقل {{field}} لا يمكن أن يكون فارغًا",
    "string.min": "الحقل {{field}} يجب ألا يقل عن {{limit}} أحرف",
    "string.max": "الحقل {{field}} يجب ألا يزيد على {{limit}} أحرف",
    "string.pattern.base": "صيغة الحقل {{field}} غير صحيحة",
    "number.base": "الحقل {{field}} يجب أن يكون رقمًا",
    "number.integer": "الحقل {{field}} يجب أن يكون رقمًا صحيحًا",
    "number.min": "الحقل {{field}} يجب ألا يقل عن {{limit}}",
    "number.max": "الحقل {{field}} يجب ألا يزيد على {{limit}}",
    "date.base": "الحقل {{field}} يجب أن يكون تاريخًا صحيحًا",
    "date.greater": "تاريخ الحقل {{field}} يجب أن يكون بعد {{limit}}",
    "boolean.base": "الحقل {{field}} يجب أن يكون قيمة منطقية",
    "array.base": "الحقل {{field}} يجب أن يكون قائمة",
    "object.base": "الحقل {{field}} يجب أن يكون كائنًا",
    "segment.invalidDates": "وقت وصول المقطع يجب أن يكون بعد وقت المغادرة",
    fallback: "قيمة الحقل {{field}} غير صحيحة",
  }),
  en: Object.freeze({
    "any.required": "{{field}} is required",
    "any.only": "{{field}} contains an unsupported value",
    "any.invalid": "{{field}} is invalid",
    "string.base": "{{field}} must be text",
    "string.empty": "{{field}} cannot be empty",
    "string.min": "{{field}} must contain at least {{limit}} characters",
    "string.max": "{{field}} must contain no more than {{limit}} characters",
    "string.pattern.base": "{{field}} has an invalid format",
    "number.base": "{{field}} must be a number",
    "number.integer": "{{field}} must be an integer",
    "number.min": "{{field}} must be greater than or equal to {{limit}}",
    "number.max": "{{field}} must be less than or equal to {{limit}}",
    "date.base": "{{field}} must be a valid date",
    "date.greater": "{{field}} must be after {{limit}}",
    "boolean.base": "{{field}} must be a boolean",
    "array.base": "{{field}} must be an array",
    "object.base": "{{field}} must be an object",
    "segment.invalidDates": "Segment arrival time must be after departure time",
    fallback: "{{field}} is invalid",
  }),
});

export const formatValidationPath = (path = []) =>
  path.reduce((result, part) =>
    typeof part === "number" ? `${result}[${part}]` : result ? `${result}.${part}` : part,
  "");

const interpolate = (template, params) =>
  template.replace(/{{(\w+)}}/g, (_, key) => String(params[key] ?? ""));

export const translateJoiError = (detail, language = "ar") => {
  const lang = language === "en" ? "en" : "ar";
  const field = formatValidationPath(detail?.path) || String(detail?.context?.key || "field");
  const limit = detail?.context?.limit;
  const renderedLimit = limit?.key
    ? formatValidationPath(limit.path || [limit.key])
    : limit;

  return {
    field,
    message: interpolate(messages[lang][detail?.type] || messages[lang].fallback, {
      field: `"${field}"`,
      limit: renderedLimit,
    }),
  };
};
