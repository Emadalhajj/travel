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

<<<<<<< HEAD
/*
طرق الدفع التجارية التي يسمح المسؤول بإنشاء
PaymentConfiguration مستقلة لها.

أما MADA / VISA / MASTERCARD / APPLE_PAY / STC_PAY
فتبقى Capabilities داخل PaymentProvider.
*/
export const PAYMENT_CONFIGURATION_METHOD_CODES =
  Object.freeze([
    "BANK_TRANSFER",
    "SADAD",
    "CARD",
    "CREDIT",
    "CASH",
  ]);

/*
=====================================================
Public Payment Display Groups
=====================================================

هذه المجموعات خاصة بطريقة عرض وسائل الدفع للعميل.

مهم:
- لا تغير configurationType.
- لا تغير paymentMethodCode.
- هي فقط طبقة Presentation لتجميع الطرق المتشابهة.
=====================================================
*/

export const PUBLIC_PAYMENT_GROUPS = Object.freeze({
  ONLINE: "ONLINE",
  BANK_TRANSFER: "BANK_TRANSFER",
  SADAD: "SADAD",
  BNPL: "BNPL",
  CASH: "CASH",
});

export const ONLINE_PAYMENT_METHODS = Object.freeze([
  "CARD",
  "MADA",
  "VISA",
  "MASTERCARD",
  "APPLE_PAY",
  "STC_PAY",
]);

export const BNPL_PAYMENT_METHODS = Object.freeze([
  "CREDIT",
  "TABBY",
  "TAMARA",
]);

export const getPublicPaymentGroupCode = (
  paymentMethodCode,
) => {
  const code = String(
    paymentMethodCode || "",
  ).toUpperCase();

  if (
    ONLINE_PAYMENT_METHODS.includes(code)
  ) {
    return PUBLIC_PAYMENT_GROUPS.ONLINE;
  }

  if (code === "BANK_TRANSFER") {
    return PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER;
  }

  if (code === "SADAD") {
    return PUBLIC_PAYMENT_GROUPS.SADAD;
  }

  if (
    BNPL_PAYMENT_METHODS.includes(code)
  ) {
    return PUBLIC_PAYMENT_GROUPS.BNPL;
  }

  if (code === "CASH") {
    return PUBLIC_PAYMENT_GROUPS.CASH;
  }

  return "";
};

/*
=====================================================
Group Public Payment Configurations
=====================================================
*/

export const groupPublicPaymentConfigurations = (
  configurations = [],
) => {
  const groups = new Map();

  configurations.forEach(
    (configuration) => {
      const groupCode =
        getPublicPaymentGroupCode(
          configuration.paymentMethodCode,
        );

      if (!groupCode) {
        return;
      }

      if (!groups.has(groupCode)) {
        groups.set(groupCode, {
          code: groupCode,
          configurations: [],
        });
      }

      groups
        .get(groupCode)
        .configurations.push(
          configuration,
        );
    },
  );

  return Array.from(groups.values());
};

/*
=====================================================
Primary Configuration Resolver
=====================================================

في الدفع الإلكتروني نفضل CARD إذا كان موجودًا،
ثم نستخدم أول إعداد متاح كدعم للسجلات القديمة.
=====================================================
*/

export const resolvePrimaryPaymentConfiguration = (
  configurations = [],
) => {
  if (!configurations.length) {
    return null;
  }

  const cardConfiguration =
    configurations.find(
      (configuration) =>
        configuration.paymentMethodCode ===
        "CARD",
    );

  return (
    cardConfiguration ||
    [...configurations].sort(
      (a, b) =>
        Number(a.sortOrder || 0) -
        Number(b.sortOrder || 0),
    )[0]
  );
};

export const DISABLED_PAYMENT_METHOD_CODES =
  Object.freeze([
    "ONLINE_PAYMENT",
  ]);
=======
export const DISABLED_PAYMENT_METHOD_CODES = Object.freeze([
  "ONLINE_PAYMENT",
]);
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

export const isPaymentMethodAvailableForConfiguration = (
  paymentMethod,
) =>
  Boolean(
    paymentMethod?.code &&
<<<<<<< HEAD
      paymentMethod.isActive !==
        false &&
      PAYMENT_CONFIGURATION_METHOD_CODES.includes(
        String(paymentMethod.code)
          .trim()
          .toUpperCase(),
      ) &&
      !DISABLED_PAYMENT_METHOD_CODES.includes(
        paymentMethod.code,
      ),
=======
      paymentMethod.isActive !== false &&
      !DISABLED_PAYMENT_METHOD_CODES.includes(paymentMethod.code),
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  );

/*
=====================================================
Public Payment Display Groups
=====================================================

هذه المجموعات خاصة بتجربة العميل فقط.
قاعدة البيانات تبقى محتفظة بطريقة الدفع الفعلية،
لكن العميل لا يحتاج رؤية علامات البطاقات كطرق مستقلة.
=====================================================
*/

export const PUBLIC_PAYMENT_GROUPS = Object.freeze({
  ELECTRONIC: "ELECTRONIC",
  BANK_TRANSFER: "BANK_TRANSFER",
  SADAD: "SADAD",
  PAY_LATER: "PAY_LATER",
  CASH: "CASH",
});

export const PUBLIC_PAYMENT_GROUP_ORDER = Object.freeze([
  PUBLIC_PAYMENT_GROUPS.ELECTRONIC,
  PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER,
  PUBLIC_PAYMENT_GROUPS.SADAD,
  PUBLIC_PAYMENT_GROUPS.PAY_LATER,
  PUBLIC_PAYMENT_GROUPS.CASH,
]);

const ELECTRONIC_METHOD_CODES = new Set([
  "CARD",
  "MADA",
  "VISA",
  "MASTERCARD",
  "APPLE_PAY",
  "STC_PAY",
]);

export const resolvePublicPaymentGroup = (paymentMethodCode) => {
  const code = String(paymentMethodCode || "").toUpperCase();

  if (ELECTRONIC_METHOD_CODES.has(code)) {
    return PUBLIC_PAYMENT_GROUPS.ELECTRONIC;
  }

  if (code === "BANK_TRANSFER") {
    return PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER;
  }

  if (code === "SADAD") {
    return PUBLIC_PAYMENT_GROUPS.SADAD;
  }

  if (code === "CREDIT") {
    return PUBLIC_PAYMENT_GROUPS.PAY_LATER;
  }

  if (code === "CASH") {
    return PUBLIC_PAYMENT_GROUPS.CASH;
  }

  return null;
};

export const groupPublicPaymentConfigurations = (configurations = []) => {
  const groups = configurations.reduce((result, configuration) => {
    const group = resolvePublicPaymentGroup(
      configuration?.paymentMethodCode,
    );

    if (!group) return result;

    if (!result[group]) {
      result[group] = [];
    }

    result[group].push(configuration);
    return result;
  }, {});

  return PUBLIC_PAYMENT_GROUP_ORDER
    .filter((group) => groups[group]?.length)
    .map((group) => ({
      code: group,
      configurations: groups[group],
      primaryConfiguration: groups[group][0],
    }));
};

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
