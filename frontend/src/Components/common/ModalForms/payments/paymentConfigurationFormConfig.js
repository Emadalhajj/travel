/*
=============================================================================
paymentConfigurationFormConfig.js
=============================================================================

Config ذكي لإعدادات الدفع.

يعتمد على:
-----------------------------------------------------------------------------
- PaymentMethod.configurationType
- PaymentProvider.supportedPaymentMethods
- BankAccount
=============================================================================
*/

import {
  PAYMENT_CONFIGURATION_TYPES,
  PAYMENT_CURRENCY_OPTIONS,
  PAYMENT_SECTION_OPTIONS,
  isPaymentMethodAvailableForConfiguration,
} from "../../../../constants/payments/paymentConfigurationConstants";

/*
=============================================================================
Payment Method Options
=============================================================================
*/

const HIDDEN_CONFIGURATION_METHOD_CODES =
  new Set([
    "ONLINE_PAYMENT",
  ]);

/*
هذه الطرق الأساسية ينشئها Payment Method Seeder.
تستخدم فقط قبل وصول أي بيانات من Redux، ولا تضاف فوق
قائمة Backend حتى لا يظهر خيار محذوف أو غير مفعّل.
*/
const REQUIRED_CONFIGURATION_METHODS = [
  ["BANK_TRANSFER", "تحويل بنكي", "Bank Transfer", "offline"],
  ["SADAD", "سداد", "SADAD", "invoice"],
  ["CARD", "الدفع الإلكتروني", "Online Payment", "online"],
  ["CREDIT", "آجل", "Credit", "credit"],
  ["CASH", "نقداً", "Cash", "cash"],
].map(([code, nameAr, nameEn]) => ({
  code,
  nameAr,
  nameEn,
  type:
    code === "BANK_TRANSFER"
      ? "offline"
      : code === "SADAD"
        ? "invoice"
        : code === "CARD"
          ? "online"
          : code.toLowerCase(),
  requiresBankAccount:
    code === "BANK_TRANSFER",
  requiresPaymentProvider:
    ["SADAD", "CARD"].includes(code),
  requiresProofUpload:
    code === "BANK_TRANSFER",
  isActive: true,
  isDeleted: false,
}));

const buildConfigurationPaymentMethods = (
  paymentMethods = [],
) => {
  const methodsByCode = new Map();

  paymentMethods.forEach((method) => {
    const code = String(
      method?.code || "",
    )
      .trim()
      .toUpperCase();

    if (
      !code ||
      method.isActive === false ||
      HIDDEN_CONFIGURATION_METHOD_CODES.has(
        code,
      )
    ) {
      return;
    }

    methodsByCode.set(code, {
      ...method,
      code,
    });
  });

  if (!paymentMethods.length) {
    REQUIRED_CONFIGURATION_METHODS.forEach((method) => {
      methodsByCode.set(method.code, method);
    });
  }

  return Array.from(
    methodsByCode.values(),
  );
};

const buildPaymentMethodOptions = (paymentMethods = []) =>
  paymentMethods
    .filter(
      isPaymentMethodAvailableForConfiguration,
    )
    .map((method) => ({
      value: method.code,

      labelAr: method.nameAr || method.nameEn || method.code,

      labelEn: method.nameEn || method.nameAr || method.code,
    }));

/*
=============================================================================
Provider Options
=============================================================================
*/

const buildProviderOptions = (paymentProviders = [], paymentMethodCode) =>
  paymentProviders
    .filter((provider) => {
      if (!provider || provider.isActive === false) {
        return false;
      }

      const supportedMethods =
        provider.supportedPaymentMethods || provider.paymentMethodCodes || [];

      return supportedMethods.includes(paymentMethodCode);
    })
    .map((provider) => ({
      value: provider._id,

      labelAr: provider.nameAr || provider.nameEn || provider.code,

      labelEn: provider.nameEn || provider.nameAr || provider.code,
    }));

/*
=============================================================================
Bank Account Options
=============================================================================
*/

const buildBankAccountOptions = (bankAccounts = []) =>
  bankAccounts
    .filter((account) => account && account.isActive !== false)
    .map((account) => {
      const bankNameAr =
        account.bankNameAr || account.bankName || account.bankNameEn || "";

      const bankNameEn =
        account.bankNameEn || account.bankName || account.bankNameAr || "";

      const accountNameAr =
        account.accountNameAr ||
        account.beneficiaryName ||
        account.accountNameEn ||
        "";

      const accountNameEn =
        account.accountNameEn ||
        account.beneficiaryName ||
        account.accountNameAr ||
        "";

      const iban = account.iban || "";

      return {
        value: account._id,

        labelAr: [bankNameAr, accountNameAr, iban].filter(Boolean).join(" — "),

        labelEn: [bankNameEn, accountNameEn, iban].filter(Boolean).join(" — "),
      };
    });

const getPaymentMethodConfigurationType = (
  paymentMethod,
) => {
  if (
    paymentMethod?.configurationType
  ) {
    return paymentMethod.configurationType;
  }

  if (
    paymentMethod?.requiresBankAccount
  ) {
    return PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT;
  }

  if (
    paymentMethod?.requiresPaymentProvider
  ) {
    return PAYMENT_CONFIGURATION_TYPES.PROVIDER;
  }

  return PAYMENT_CONFIGURATION_TYPES.MANUAL;
};

/*
=============================================================================
Common Fields
=============================================================================

هذه الحقول مشتركة بين جميع طرق الدفع، لذلك لا توضع داخل الفروع الشرطية.
=============================================================================
*/

const buildCommonFields = ({ paymentMethods, sectionOptions }) => [
  {
    name: "sectionCode",

    type: "select",

    labelAr: "القسم",

    labelEn: "Section",

    options: sectionOptions,

    required: true,

    defaultValue: "",

    order: 1,

    col: 6,
  },

  {
    name: "paymentMethodCode",

    type: "select",

    labelAr: "طريقة الدفع",

    labelEn: "Payment method",

    options: buildPaymentMethodOptions(paymentMethods),

    required: true,

    defaultValue: "",

    order: 2,

    col: 6,

    onValueChange: ({
      value,
      next,
    }) => {
      const method =
        paymentMethods.find(
          (item) =>
            String(
              item?.code || "",
            ).toUpperCase() ===
            String(value || "").toUpperCase(),
        );

      const configurationType =
        getPaymentMethodConfigurationType(
          method,
        );

      return {
        ...next,
        paymentMethodCode: value,
        configurationType,
        providerId: "",
        bankAccountIds: [],
        displayNameAr:
          method?.nameAr || "",
        displayNameEn:
          method?.nameEn || "",
        instructionsAr: "",
        instructionsEn: "",
        requiresAttachment: Boolean(
          method?.requiresProofUpload,
        ),
        requiresReference:
          String(value).toUpperCase() ===
          "BANK_TRANSFER",
      };
    },
  },

  {
    name: "supportedCurrencies",

    type: "checkbox-group",

    valueMode: "array",

    labelAr: "العملات المدعومة",

    labelEn: "Supported currencies",

    options: PAYMENT_CURRENCY_OPTIONS,

    defaultValue: ["SAR"],

    required: true,

    order: 10,

    col: 12,
  },

  {
    name: "displayNameAr",

    type: "text",

    labelAr: "الاسم الظاهر بالعربية",

    labelEn: "Arabic display name",

    order: 20,

    col: 6,
  },

  {
    name: "displayNameEn",

    type: "text",

    labelAr: "الاسم الظاهر بالإنجليزية",

    labelEn: "English display name",

    order: 21,

    col: 6,
  },

  {
    name: "instructionsAr",

    type: "textarea",

    labelAr: "التعليمات بالعربية",

    labelEn: "Arabic instructions",

    rows: 4,

    order: 30,

    col: 6,
  },

  {
    name: "instructionsEn",

    type: "textarea",

    labelAr: "التعليمات بالإنجليزية",

    labelEn: "English instructions",

    rows: 4,

    order: 31,

    col: 6,
  },

  {
    name: "requiresAttachment",

    type: "checkbox",

    labelAr: "يتطلب إرفاق ملف",

    labelEn: "Requires attachment",

    defaultValue: false,

    order: 40,

    col: 6,
  },

  {
    name: "requiresReference",

    type: "checkbox",

    labelAr: "يتطلب رقمًا مرجعيًا",

    labelEn: "Requires reference number",

    defaultValue: false,

    order: 41,

    col: 6,
  },

  {
    name: "minimumAmount",

    type: "number",

    labelAr: "الحد الأدنى للمبلغ",

    labelEn: "Minimum amount",

    min: 0,

    step: 0.01,

    order: 50,

    col: 6,
  },

  {
    name: "maximumAmount",

    type: "number",

    labelAr: "الحد الأعلى للمبلغ",

    labelEn: "Maximum amount",

    min: 0,

    step: 0.01,

    order: 51,

    col: 6,
  },

  {
    name: "availableFrom",

    type: "date",

    labelAr: "متاح من",

    labelEn: "Available from",

    order: 60,

    col: 6,
  },

  {
    name: "availableUntil",

    type: "date",

    labelAr: "متاح حتى",

    labelEn: "Available until",

    order: 61,

    col: 6,
  },

  {
    name: "sortOrder",

    type: "number",

    labelAr: "ترتيب العرض",

    labelEn: "Display order",

    defaultValue: 0,

    min: 0,

    step: 1,

    order: 70,

    col: 6,
  },

  {
    name: "isActive",

    type: "checkbox",

    labelAr: "مفعّل",

    labelEn: "Active",

    defaultValue: true,

    order: 71,

    col: 6,
  },
];

/*
=============================================================================
Conditional Fields
=============================================================================

كل فرع يحتوي فقط الحقول الخاصة به.
=============================================================================
*/

const buildConditionalFields = ({
  paymentMethods = [],
  paymentProviders = [],
  bankAccounts = [],
}) =>
  paymentMethods.reduce((conditionalFields, paymentMethod) => {
    if (
      !paymentMethod?.code ||
      paymentMethod.isActive === false ||
      HIDDEN_CONFIGURATION_METHOD_CODES.has(
        String(paymentMethod.code).toUpperCase(),
      )
    ) {
      return conditionalFields;
    }

    const { code } = paymentMethod;

    const configurationType =
      getPaymentMethodConfigurationType(
        paymentMethod,
      );

    /*
      =======================================================================
      Bank Account
      =======================================================================
      */

    if (configurationType === PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT) {
      conditionalFields[code] = [
        {
          name: "configurationType",

          type: "hidden",

          defaultValue: PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT,

          order: 3,
        },

        {
          name: "bankAccountIds",

          type: "checkbox-group",

          valueMode: "array",

          labelAr: "الحسابات البنكية",

          labelEn: "Bank accounts",

          options: buildBankAccountOptions(bankAccounts),

          defaultValue: [],

          required: true,

          order: 4,

          col: 12,
        },
      ];

      return conditionalFields;
    }

    /*
      =======================================================================
      Provider
      =======================================================================
      */

    if (configurationType === PAYMENT_CONFIGURATION_TYPES.PROVIDER) {
      conditionalFields[code] = [
        {
          name: "configurationType",

          type: "hidden",

          defaultValue: PAYMENT_CONFIGURATION_TYPES.PROVIDER,

          order: 3,
        },

        {
          name: "providerId",

          type: "select",

          labelAr: "مزود الدفع",

          labelEn: "Payment provider",

          options: buildProviderOptions(paymentProviders, code),

          defaultValue: "",

          required: true,

          order: 4,

          col: 12,
        },
      ];

      return conditionalFields;
    }

    /*
      =======================================================================
      Manual
      =======================================================================
      */

    conditionalFields[code] = [
      {
        name: "configurationType",

        type: "hidden",

        defaultValue: PAYMENT_CONFIGURATION_TYPES.MANUAL,

        order: 3,
      },
    ];

    return conditionalFields;
  }, {});

/*
=============================================================================
Main Config Builder
=============================================================================
*/

export const buildPaymentConfigurationFormConfig = ({
  paymentMethods = [],
  paymentProviders = [],
  bankAccounts = [],

  sectionOptions = PAYMENT_SECTION_OPTIONS,
} = {}) => {
  const configurationPaymentMethods =
    buildConfigurationPaymentMethods(
      paymentMethods,
    );

  return {
    conditionKey: "paymentMethodCode",

    commonFields: buildCommonFields({
      paymentMethods:
        configurationPaymentMethods,
      sectionOptions,
    }),

    conditionalFields: buildConditionalFields({
      paymentMethods:
        configurationPaymentMethods,
      paymentProviders,
      bankAccounts,
    }),
  };
};

export default buildPaymentConfigurationFormConfig;
