// constants/draft-bookings/draft-booking-status.js

/*
=====================================================
Draft Booking Status Constants
=====================================================

حالات مسودة الحجز.

تستخدم هذه الحالات لمعرفة وضع المسودة داخل النظام.

الحالات:
-----------------------------------------------------
- DRAFT: المسودة ما زالت قيد الإنشاء
- COMPLETED: تم تحويل المسودة إلى حجز حقيقي
- EXPIRED: انتهت صلاحية المسودة
- CANCELLED: تم إلغاء المسودة

الهدف:
-----------------------------------------------------
توحيد حالات مسودات الحجز بدل كتابتها يدويًا داخل أكثر من ملف.
=====================================================
*/

export const DRAFT_BOOKING_STATUS = {
  DRAFT: "draft",
  COMPLETED: "completed",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

export const DRAFT_BOOKING_STATUS_LIST = Object.values(DRAFT_BOOKING_STATUS);