import { translateError } from "../constants/errors/error-messages.js";
import { getRequestLanguage } from "../utils/getRequestLanguage.js";
import { operationalLogger, safeErrorContext } from "../utils/operational-logger.js";

const SECURITY_VISIBLE_CODES = new Set([
  "INVALID_WEBHOOK_SIGNATURE",
  "INVALID_WEBHOOK_PAYLOAD",
  "STRIPE_SIGNATURE_MISSING",
  "STRIPE_SIGNATURE_INVALID",
  "STRIPE_PROVIDER_MISMATCH",
]);

export const errorHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || err?.status || 500;
  const language = getRequestLanguage(req);
  const exposeMessage = Boolean(err?.code) || statusCode < 500 || process.env.NODE_ENV === "development";
  const message = err?.code
    ? translateError(err.code, language, err.params)
    : exposeMessage
      ? err?.message || (language === "en" ? "An error occurred" : "حدث خطأ")
      : language === "en" ? "An unexpected error occurred" : "حدث خطأ غير متوقع";

  const payload = {
    success: false,
    message,
  };

  if (err?.code) payload.code = err.code;

  // إذا كان الخطأ يحتوي على حقل مرتبط بالحقل في الفورم
  if (err?.field) payload.field = err.field;

  // إضافة تفاصيل أخطاء إضافية إن وجدت
  if (statusCode < 500 && err?.errors) payload.errors = err.errors;
  if (statusCode < 500 && err?.quote) payload.quote = err.quote;

  // عرض الستاك في التطوير للمساعدة بالتصحيح
  if (process.env.NODE_ENV === "development") payload.stack = err?.stack;

  if (SECURITY_VISIBLE_CODES.has(err?.code)) {
    operationalLogger.warn("webhook_rejected", safeErrorContext(err, {
      requestId: req?.requestId,
      method: req?.method,
      path: req?.path,
      statusCode,
    }));
  } else if (statusCode >= 500) {
    operationalLogger.error("http_request_failed", safeErrorContext(err, {
      requestId: req?.requestId,
      method: req?.method,
      path: req?.path,
      statusCode,
    }));
  }

  return res.status(statusCode).json(payload);
};
