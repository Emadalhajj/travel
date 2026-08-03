/*
=====================================================
Payment Transaction Statuses
=====================================================

المصدر الوحيد لحالات معاملة الدفع.

مهم:
-----------------------------------------------------
تم إبقاء قيم التخزين بصيغة lowercase حتى لا تنكسر
المعاملات والاستعلامات الموجودة حاليًا في المشروع.

أسماء المفاتيح Uppercase للاستخدام الواضح داخل الكود.
=====================================================
*/

export const PAYMENT_TRANSACTION_STATUSES = Object.freeze({
  INITIATED: "initiated",
  PENDING: "pending",
  PENDING_PROOF: "pending_proof",
  PENDING_APPROVAL: "pending_approval",
  PENDING_VERIFICATION: "pending_verification",
  PENDING_REVIEW: "pending_review",
  PROCESSING: "processing",
  AUTHORIZED: "authorized",
  CAPTURED: "captured",
  SUCCESS: "success",
  PAID_PENDING_BOOKING: "paid_pending_booking",
  FAILED: "failed",
  REJECTED: "rejected",
  CANCELED: "cancelled",
  EXPIRED: "expired",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
});

export const PAYMENT_TRANSACTION_STATUS_VALUES = Object.freeze(
  Object.values(PAYMENT_TRANSACTION_STATUSES),
);

/*
الحالة paid موجودة في البيانات والخدمات القديمة.
تُعامل مؤقتًا كحالة نجاح حتى يتم تنفيذ Migration لاحقًا.
*/
export const LEGACY_PAYMENT_TRANSACTION_STATUSES = Object.freeze({
  PAID: "paid",
});

export const PAYMENT_TRANSACTION_STORAGE_STATUS_VALUES = Object.freeze([
  ...PAYMENT_TRANSACTION_STATUS_VALUES,
  ...Object.values(LEGACY_PAYMENT_TRANSACTION_STATUSES),
]);

/*
الحالات التي تدخل في حساب إجمالي المبالغ المدفوعة.
*/
export const SETTLED_PAYMENT_TRANSACTION_STATUSES = Object.freeze([
  PAYMENT_TRANSACTION_STATUSES.SUCCESS,
  PAYMENT_TRANSACTION_STATUSES.CAPTURED,
  PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
  LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
]);

/*
الحالات النشطة التي يمكن إعادة استخدامها لمنع إنشاء
معاملة جديدة عند الضغط المتكرر على زر الدفع.
*/
export const REUSABLE_PAYMENT_TRANSACTION_STATUSES = Object.freeze([
  PAYMENT_TRANSACTION_STATUSES.INITIATED,
  PAYMENT_TRANSACTION_STATUSES.PENDING,
  PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF,
  PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL,
  PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
  PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
  PAYMENT_TRANSACTION_STATUSES.PROCESSING,
]);
