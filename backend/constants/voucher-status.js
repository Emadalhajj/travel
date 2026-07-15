// constants/vouchers/voucher-status.js

/*
=====================================================
Voucher Status Constants
=====================================================

حالات الفاوتشر داخل النظام.

تستخدم هذه القيم في:
-----------------------------------------------------
- voucher-model.js
- voucher-service.js
- controller
- أي عملية فلترة أو تحديث حالة الفاوتشر

الهدف:
-----------------------------------------------------
توحيد الحالات بدل كتابتها يدويًا داخل أكثر من ملف.
=====================================================
*/

export const VOUCHER_STATUS = {
  GENERATED: "generated",
  SENT: "sent",
  CANCELLED: "cancelled",
};

export const VOUCHER_STATUS_LIST = Object.values(VOUCHER_STATUS);