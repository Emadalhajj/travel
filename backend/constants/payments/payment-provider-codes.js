/*
=====================================================
Payment Provider Codes
=====================================================

يحتوي الأكواد الثابتة لمزودي الدفع الإلكتروني.

تستخدم هذه الأكواد في:
-----------------------------------------------------
- PaymentProvider Model
- Validation
- Smart Form
- Payment Provider Factory
- PaymentConfiguration لاحقًا

مهم:
-----------------------------------------------------
الكود ثابت ولا يعتمد على الاسم المعروض للمستخدم.
=====================================================
*/

export const PAYMENT_PROVIDER_CODES =
  Object.freeze({
    HYPERPAY: "HYPERPAY",

    MOYASAR: "MOYASAR",

    GEIDEA: "GEIDEA",

    PAYTABS: "PAYTABS",

    TAP: "TAP",

    STRIPE: "STRIPE",
  });

/*
=====================================================
Payment Provider Code Values
=====================================================

تحويل الكائن السابق إلى Array لاستخدامه في:

- Mongoose enum
- Joi valid
- Select Options
=====================================================
*/

export const PAYMENT_PROVIDER_CODE_VALUES =
  Object.freeze(
    Object.values(
      PAYMENT_PROVIDER_CODES,
    ),
  );