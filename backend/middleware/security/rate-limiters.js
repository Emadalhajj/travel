import { rateLimit } from "express-rate-limit";

const createLimiter = ({ windowMs, limit, message }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message },
});

export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "محاولات مصادقة كثيرة، يرجى المحاولة لاحقًا",
});

export const passwordResetRateLimiter = createLimiter({
  windowMs: 30 * 60 * 1000,
  limit: 5,
  message: "طلبات استعادة كثيرة، يرجى المحاولة لاحقًا",
});

export const draftCreationRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: "تم تجاوز حد إنشاء المسودات مؤقتًا",
});

export const paymentInitializeRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: "تم تجاوز حد تهيئة عمليات الدفع مؤقتًا",
});

export const paymentStatusRateLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  message: "طلبات حالة الدفع كثيرة، يرجى المحاولة لاحقًا",
});

export const uploadRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "تم تجاوز حد رفع الملفات مؤقتًا",
});

export const paymentCallbackRateLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  message: "طلبات تحقق الدفع كثيرة، يرجى المحاولة لاحقًا",
});
