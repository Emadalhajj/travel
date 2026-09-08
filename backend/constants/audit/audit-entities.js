// constants/audit/audit-entities.js

/*
=====================================================
Audit Entities Constants
=====================================================

هذا الملف يحتوي على أسماء الكيانات التي نريد مراقبتها.

مثال:
-----------------------------------------------------
- booking
- draft_booking
- voucher
- payment_transaction
=====================================================
*/

export const AUDIT_ENTITIES = {
  BOOKING: "booking",
  DRAFT_BOOKING: "draft_booking",
  VOUCHER: "voucher",
  PAYMENT_TRANSACTION: "payment_transaction",
  INVENTORY: "inventory",
  NOTIFICATION: "notification",
  USER: "user",
  UMRAH_PROGRAM: "umrah_program",
  TRIP: "trip",
  BANK_ACCOUNT: "bank_account",
  PAYMENT_METHOD: "payment_method",
  PAYMENT_PROVIDER: "payment_provider",
  PAYMENT_CONFIGURATION:
    "payment_configuration",
    TRIP_DEPARTURE: "trip_departure",
};

export const AUDIT_ENTITIES_LIST = Object.values(AUDIT_ENTITIES);
