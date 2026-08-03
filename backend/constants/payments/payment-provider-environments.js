/*
=====================================================
Payment Provider Environments
=====================================================

TEST:
بيئة الاختبار.

LIVE:
بيئة الدفع الفعلية.
=====================================================
*/

export const PAYMENT_PROVIDER_ENVIRONMENTS =
  Object.freeze({
    TEST: "TEST",

    LIVE: "LIVE",
  });

export const PAYMENT_PROVIDER_ENVIRONMENT_VALUES =
  Object.freeze(
    Object.values(
      PAYMENT_PROVIDER_ENVIRONMENTS,
    ),
  );