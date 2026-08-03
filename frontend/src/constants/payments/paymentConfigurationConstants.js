/*
=====================================================
Payment Configuration Constants
=====================================================
*/

export const PAYMENT_SECTION_CODES = {
  PROGRAM_BOOKING: "PROGRAM_BOOKING",

  CUSTOM_PACKAGE: "CUSTOM_PACKAGE",

  VISA_BOOKING: "VISA_BOOKING",

  FLIGHT_BOOKING: "FLIGHT_BOOKING",

  HOTEL_BOOKING: "HOTEL_BOOKING",
};

export const PAYMENT_CONFIGURATION_TYPES = {
  PROVIDER: "PROVIDER",

  BANK_ACCOUNT: "BANK_ACCOUNT",

  MANUAL: "MANUAL",
};

/*
=====================================================
Payment Method Groups
=====================================================

يجب أن تطابق القواعد الموجودة في Backend.
=====================================================
*/

export const BANK_ACCOUNT_PAYMENT_METHODS = ["BANK_TRANSFER"];

export const PROVIDER_PAYMENT_METHODS = [
  "CARD",

  "MADA",

  "VISA",

  "MASTERCARD",

  "APPLE_PAY",

  "STC_PAY",

  "SADAD",
];

export const MANUAL_PAYMENT_METHODS = ["CASH", "CREDIT"];

export const DISABLED_PAYMENT_METHOD_CODES =
  Object.freeze([
    "ONLINE_PAYMENT",
  ]);

export const isPaymentMethodAvailableForConfiguration = (
  paymentMethod,
) =>
  Boolean(
    paymentMethod?.code &&
      paymentMethod.isActive !==
        false &&
      !DISABLED_PAYMENT_METHOD_CODES.includes(
        paymentMethod.code,
      ),
  );

/*
=====================================================
Section Options
=====================================================
*/

export const PAYMENT_SECTION_OPTIONS = [
  {
    value: PAYMENT_SECTION_CODES.PROGRAM_BOOKING,

    labelAr: "حجز برامج العمرة",

    labelEn: "Umrah Program Booking",
  },

  {
    value: PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,

    labelAr: "الباقات المخصصة",

    labelEn: "Custom Packages",
  },

  {
    value: PAYMENT_SECTION_CODES.VISA_BOOKING,

    labelAr: "طلبات التأشيرات",

    labelEn: "Visa Booking",
  },

  {
    value: PAYMENT_SECTION_CODES.FLIGHT_BOOKING,

    labelAr: "حجز الرحلات",

    labelEn: "Flight Booking",
  },

  {
    value: PAYMENT_SECTION_CODES.HOTEL_BOOKING,

    labelAr: "حجز الفنادق",

    labelEn: "Hotel Booking",
  },
];

/*
=====================================================
Currency Options
=====================================================
*/

export const PAYMENT_CURRENCY_OPTIONS = [
  {
    value: "SAR",

    labelAr: "ريال سعودي",

    labelEn: "Saudi Riyal",
  },

  {
    value: "USD",

    labelAr: "دولار أمريكي",

    labelEn: "US Dollar",
  },

  {
    value: "EUR",

    labelAr: "يورو",

    labelEn: "Euro",
  },
];
