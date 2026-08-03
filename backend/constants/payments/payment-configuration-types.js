/*
=====================================================
Payment Configuration Types
=====================================================

تحدد كيفية معالجة طريقة الدفع داخل القسم.

PROVIDER:
طريقة دفع إلكترونية تحتاج مزود خدمة.

BANK_ACCOUNT:
تحويل بنكي يحتاج حسابًا أو أكثر.

MANUAL:
طريقة يدوية لا تحتاج مزودًا ولا حسابًا بنكيًا.
=====================================================
*/

export const PAYMENT_CONFIGURATION_TYPES = {
  PROVIDER: "PROVIDER",

  BANK_ACCOUNT:
    "BANK_ACCOUNT",

  MANUAL: "MANUAL",
};

export const PAYMENT_CONFIGURATION_TYPE_VALUES =
  Object.values(
    PAYMENT_CONFIGURATION_TYPES,
  );

  /*
  هذا يجعل السجل واضحًا:

configurationType: "PROVIDER"

بدل الاعتماد فقط على وجود providerId.
  */