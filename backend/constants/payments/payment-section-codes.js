/*
=====================================================
Payment Section Codes
=====================================================

تمثل الأقسام التي يمكن التحكم في طرق الدفع
المتاحة داخلها.

تستخدم هذه القيم في:
-----------------------------------------------------
- PaymentConfiguration Model
- Validation
- Admin Form
- Public Payment Resolver
- Checkout Service
=====================================================
*/

export const PAYMENT_SECTION_CODES = {
  PROGRAM_BOOKING:
    "PROGRAM_BOOKING",

  CUSTOM_PACKAGE:
    "CUSTOM_PACKAGE",

  VISA_BOOKING:
    "VISA_BOOKING",

  FLIGHT_BOOKING:
    "FLIGHT_BOOKING",

  HOTEL_BOOKING:
    "HOTEL_BOOKING",
      
};

/*
=====================================================
Payment Section Code Values
=====================================================

تستخدم مباشرة داخل:

enum
Joi.valid
select options
=====================================================
*/

export const PAYMENT_SECTION_CODE_VALUES =
  Object.values(
    PAYMENT_SECTION_CODES,
  );