// utils/requestInfo.js

/*
=====================================================
Request Info Utility
=====================================================

هذا الملف يستخرج معلومات مهمة من request.

يستخدم مع:
-----------------------------------------------------
- Audit Log
- Security Events

الهدف:
-----------------------------------------------------
تسجيل معلومات مثل:
- IP Address
- User Agent
- Method
- URL
=====================================================
*/

export const getRequestInfo = (req) => {
  return {
    ip:
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.ip ||
      null,

    userAgent: req.headers["user-agent"] || null,

    method: req.method,

    url: req.originalUrl,
  };
};