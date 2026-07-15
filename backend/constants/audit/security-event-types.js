// constants/audit/security-event-types.js

/*
=====================================================
Security Event Types Constants
=====================================================

أنواع الأحداث الأمنية داخل النظام.

تستخدم لتسجيل:
-----------------------------------------------------
- محاولات دخول فاشلة
- صلاحيات غير كافية
- توكن غير صالح
- وصول ممنوع
=====================================================
*/

export const SECURITY_EVENT_TYPES = {
  FAILED_LOGIN: "failed_login",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
  FORBIDDEN_ACCESS: "forbidden_access",
  INVALID_TOKEN: "invalid_token",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
};

export const SECURITY_EVENT_TYPES_LIST = Object.values(SECURITY_EVENT_TYPES);