// unified error handler used by thunks
export const handleApiError = (
  err,
  rejectWithValue,
  lang = "ar",
  options = {},
) => {
  const response = err?.response?.data;

  const isArabic = lang === "ar";

  const getMessage = (value) => {
    if (!value) {
      return isArabic ? "خطأ في الحقل" : "Field error";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      if (value.messageAr) return value.messageAr;
      if (value.messageEn) return value.messageEn;

      if (value.message) {
        if (value.kind === "required") {
          return isArabic ? "هذا الحقل مطلوب" : "This field is required";
        }

        return value.message;
      }
    }

    return isArabic ? "خطأ في الحقل" : "Field error";
  };

  if (response?.errors) {
    const formattedErrors = {};

    Object.entries(response.errors).forEach(([key, value]) => {
      formattedErrors[key] = getMessage(value);
    });

    if (options.structured) {
      return rejectWithValue({
        message:
          response.message ||
          (isArabic
            ? "تعذر تنفيذ الطلب"
            : "Request failed"),
        field:
          response.field || null,
        errors:
          formattedErrors,
      });
    }

    return rejectWithValue(formattedErrors);
  }

  const message =
    response?.message ||
    (options.preferErrorMessage ? err?.message : null) ||
    options.fallbackMessage ||
    (typeof err === "string" ? err : null) ||
    err?.message ||
    (isArabic
      ? "حدث خطأ غير متوقع"
      : "Unexpected error");

  if (response?.field && !options.structured) {
    return rejectWithValue({ [response.field]: message });
  }

  return rejectWithValue(
    options.structured
      ? {
          message,
          field:
            response?.field || null,
          errors: {},
        }
      : message,
  );
};

// export const handleApiError = (err, rejectWithValue) => {
//   const response = err?.response?.data;

//   if (response?.errors) {
//     const formattedErrors = {};

//     Object.entries(response.errors).forEach(([key, value]) => {
//       formattedErrors[key] =
//         typeof value === "object"
//           ? value.message || "خطأ في الحقل"
//           : value;
//     });

//     return rejectWithValue(formattedErrors);
//   }

//   return rejectWithValue(
//     response?.message ||
//       err?.message ||
//       "حدث خطأ غير متوقع"
//   );
// };

