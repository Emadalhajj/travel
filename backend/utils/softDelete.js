// utils/softDelete.js

/*
=====================================================
Soft Delete Utility
=====================================================

هذا الملف يحتوي دوال عامة للحذف الناعم
واسترجاع العناصر المحذوفة.

لا يرتبط بموديل معين.

يعني يمكن استخدامه مع:
-----------------------------------------------------
- Booking
- Voucher
- DraftBooking
- Inventory
- Notification
- PaymentTransaction

الهدف:
-----------------------------------------------------
عدم تكرار منطق الحذف الناعم داخل كل service.
=====================================================
*/

/*
=====================================================
softDeleteDocument
=====================================================

تنفذ حذفًا ناعمًا على document واحد.

تقوم بتحديث:
-----------------------------------------------------
- isDeleted = true
- deletedAt = التاريخ الحالي
- deletedBy = المستخدم الذي حذف

ملاحظة:
-----------------------------------------------------
هذه الدالة تستقبل document وليس model.
=====================================================
*/

export const softDeleteDocument = async ({ document, userId }) => {
  if (!document) {
    throw new Error("Document not found");
  }

  if (document.isDeleted) {
    throw new Error("Document already deleted");
  }

  document.isDeleted = true;
  document.deletedAt = new Date();
  document.deletedBy = userId || null;

  await document.save();

  return document;
};

/*
=====================================================
restoreDeletedDocument
=====================================================

استرجاع document محذوف حذفًا ناعمًا.

تقوم بتحديث:
-----------------------------------------------------
- isDeleted = false
- deletedAt = null
- deletedBy = null
=====================================================
*/

export const restoreDeletedDocument = async ({ document }) => {
  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.isDeleted) {
    throw new Error("Document is not deleted");
  }

  document.isDeleted = false;
  document.deletedAt = null;
  document.deletedBy = null;

  await document.save();

  return document;
};