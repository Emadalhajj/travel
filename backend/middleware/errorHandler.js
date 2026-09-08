import { translateError } from "../constants/errors/error-messages.js";
import { getRequestLanguage } from "../utils/getRequestLanguage.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || 400;
  const language = getRequestLanguage(req);
  const message = err?.code
    ? translateError(err.code, language, err.params)
    : err?.message || (language === "en" ? "An error occurred" : "حدث خطأ");

  const payload = {
    success: false,
    message,
  };

  if (err?.code) payload.code = err.code;

  // إذا كان الخطأ يحتوي على حقل مرتبط بالحقل في الفورم
  if (err?.field) payload.field = err.field;

  // إضافة تفاصيل أخطاء إضافية إن وجدت
  if (err?.errors) payload.errors = err.errors;

  // عرض الستاك في التطوير للمساعدة بالتصحيح
  if (process.env.NODE_ENV === "development") payload.stack = err?.stack;

  return res.status(statusCode).json(payload);
};
