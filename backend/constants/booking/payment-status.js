/*
=====================================================
Payment Status Constants
=====================================================

هذا الملف يحتوي حالات الدفع في النظام.

الحالات:
-----------------------------------------------------
pending  => لم يتم الدفع
partial  => دفع جزئي
paid     => مدفوع بالكامل
failed   => فشل الدفع
refunded => تم الاسترجاع
=====================================================
*/

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);