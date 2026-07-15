/*
=====================================================
Booking Status Constants
=====================================================

هذا الملف يحتوي حالات الحجز المعتمدة في النظام.

الهدف:
-----------------------------------------------------
بدل تكرار النصوص مثل:
"draft"
"confirmed"
"cancelled"

في أكثر من ملف، نستخدم constants موحدة.

الفائدة:
-----------------------------------------------------
1- منع الأخطاء الإملائية.
2- توحيد الحالات في كل المشروع.
3- سهولة التعديل مستقبلاً.
=====================================================
*/

export const BOOKING_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const BOOKING_STATUS_LIST = Object.values(BOOKING_STATUS);