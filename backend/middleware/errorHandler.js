export const errorHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || 400;

  const payload = {
    success: false,
    message: err?.message || "حدث خطأ",
  };

  // إذا كان الخطأ يحتوي على حقل مرتبط بالحقل في الفورم
  if (err?.field) payload.field = err.field;

  // إضافة تفاصيل أخطاء إضافية إن وجدت
  if (err?.errors) payload.errors = err.errors;

  // عرض الستاك في التطوير للمساعدة بالتصحيح
  if (process.env.NODE_ENV === "development") payload.stack = err?.stack;

  return res.status(statusCode).json(payload);
};
