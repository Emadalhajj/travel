/*
=====================================================
Payment Method Form Config
=====================================================

فورم ذكي يعتمد على كود طريقة الدفع.

الحقل المحدد في conditionKey يقرر الحقول التي
ستظهر من conditionalFields.

مثال:
-----------------------------------------------------
BANK_TRANSFER
→ إعدادات التحويل البنكي.

MADA / VISA / MASTERCARD
→ إعدادات الدفع الإلكتروني.

CASH
→ إعدادات الدفع النقدي.
=====================================================
*/

const paymentCodeOptions = [
  {
    value: "BANK_TRANSFER",
    labelAr: "تحويل بنكي",
    labelEn: "Bank Transfer",
  },
  {
    value: "SADAD",
    labelAr: "سداد",
    labelEn: "SADAD",
  },
  {
    value: "CARD",
    labelAr: "الدفع الإلكتروني",
    labelEn: "Online Payment",
  },
  {
    value: "MADA",
    labelAr: "مدى",
    labelEn: "Mada",
  },
  {
    value: "VISA",
    labelAr: "فيزا",
    labelEn: "Visa",
  },
  {
    value: "MASTERCARD",
    labelAr: "ماستركارد",
    labelEn: "Mastercard",
  },
  {
    value: "APPLE_PAY",
    labelAr: "Apple Pay",
    labelEn: "Apple Pay",
  },
  {
    value: "STC_PAY",
    labelAr: "STC Pay",
    labelEn: "STC Pay",
  },
  {
    value: "CASH",
    labelAr: "نقدًا",
    labelEn: "Cash",
  },
  {
    value: "CREDIT",
    labelAr: "آجل",
    labelEn: "Credit",
  },
];

/*
=====================================================
Common Details
=====================================================

هذه الحقول تظهر لجميع طرق الدفع.
=====================================================
*/

const commonDetailsFields = [
  {
    name: "nameAr",
    labelAr: "الاسم بالعربية",
    labelEn: "Arabic Name",
    type: "text",
    col: 6,
    required: true,
    order: 10,
  },
  {
    name: "nameEn",
    labelAr: "الاسم بالإنجليزية",
    labelEn: "English Name",
    type: "text",
    col: 6,
    required: true,
    order: 10,
  },
  {
    name: "descriptionAr",
    labelAr: "الوصف بالعربية",
    labelEn: "Arabic Description",
    type: "textarea",
    rows: 3,
    col: 6,
    order: 20,
  },
  {
    name: "descriptionEn",
    labelAr: "الوصف بالإنجليزية",
    labelEn: "English Description",
    type: "textarea",
    rows: 3,
    col: 6,
    order: 20,
  },
  {
    name: "icon",
    labelAr: "رابط أو اسم الأيقونة",
    labelEn: "Icon Name or URL",
    type: "text",
    col: 6,
    order: 30,
  },
  {
    name: "sortOrder",
    labelAr: "ترتيب العرض",
    labelEn: "Sort Order",
    type: "number",
    col: 6,
    min: 0,
    defaultValue: 0,
    order: 30,
  },
  {
    name: "isActive",
    labelAr: "طريقة الدفع مفعلة",
    labelEn: "Active",
    type: "checkbox",
    col: 12,
    defaultValue: true,
    order: 100,
  },
];

/*
=====================================================
Hidden System Fields Helper
=====================================================

الحقول التالية لا يقررها المدير يدويًا.

يحددها النظام حسب الكود المختار حتى لا يحدث مثلًا:

BANK_TRANSFER + requiresPaymentProvider = true

وهو تركيب غير صحيح.
=====================================================
*/

const systemFields = ({
  type,
  requiresBankAccount = false,
  requiresPaymentProvider = false,
  requiresProofUpload = false,
}) => [
  {
    name: "type",
    type: "hidden",
    defaultValue: type,
    order: 1,
  },
  {
    name: "requiresBankAccount",
    type: "hidden",
    defaultValue: requiresBankAccount,
    order: 2,
  },
  {
    name: "requiresPaymentProvider",
    type: "hidden",
    defaultValue: requiresPaymentProvider,
    order: 3,
  },
  {
    name: "requiresProofUpload",
    type: "hidden",
    defaultValue: requiresProofUpload,
    order: 4,
  },
];

/*
=====================================================
Online Method Fields
=====================================================
*/

const onlineMethodFields = () => [
  ...systemFields({
    type: "online",
    requiresBankAccount: false,
    requiresPaymentProvider: true,
    requiresProofUpload: false,
  }),

  {
    name: "providerInfo",
    labelAr: "إعدادات مزود الدفع",
    labelEn: "Payment Provider Configuration",
    type: "info",
    col: 12,
    order: 40,

    textAr:
      "سيتم اختيار مزود الدفع مثل HyperPay عند ربط الطريقة بالقسم أو المنتج.",

    textEn:
      "The payment provider, such as HyperPay, will be selected when assigning this method to a section or product.",
  },
];

/*
=====================================================
Payment Method Config
=====================================================
*/

export const paymentMethodFormConfig = () => {
  return {
    /*
    الحقل الذي يتحكم في الحقول الشرطية.
    */

    conditionKey: "code",

    /*
    الحقول التي تظهر دائمًا.
    */

    commonFields: [
      {
        name: "code",
        labelAr: "كود طريقة الدفع",
        labelEn: "Payment Method Code",
        type: "select",
        col: 12,
        required: true,
        order: 1,
        options: paymentCodeOptions,
      },

      ...commonDetailsFields,
    ],

    /*
    الحقول التي تظهر بحسب قيمة code.
    */

    conditionalFields: {
      /*
      ===============================================
      Bank Transfer
      ===============================================
      */

      BANK_TRANSFER: [
        {
          name: "type",
          type: "hidden",
          defaultValue: "offline",
          order: 1,
        },
        {
          name: "requiresBankAccount",
          type: "hidden",
          defaultValue: true,
          order: 2,
        },
        {
          name: "requiresPaymentProvider",
          type: "hidden",
          defaultValue: false,
          order: 3,
        },
        {
          name: "requiresProofUpload",
          labelAr: "يتطلب رفع صورة الحوالة",
          labelEn: "Requires Transfer Proof",
          type: "checkbox",
          col: 12,
          defaultValue: true,
          order: 40,
        },

        {
          name: "bankAccountInfo",
          labelAr: "الحسابات البنكية",
          labelEn: "Bank Accounts",
          type: "info",
          col: 12,
          order: 50,

          textAr:
            "ستحدد الحسابات البنكية المتاحة لاحقًا من صفحة ربط طرق الدفع بالأقسام والمنتجات.",

          textEn:
            "Available bank accounts will be selected later from the payment assignment page.",
        },
      ],

      /*
      ===============================================
      SADAD
      ===============================================
      */

      SADAD: [
        ...systemFields({
          type: "invoice",
          requiresBankAccount: false,
          requiresPaymentProvider: true,
          requiresProofUpload: false,
        }),

        {
          name: "sadadInfo",
          labelAr: "تكامل سداد",
          labelEn: "SADAD Integration",
          type: "info",
          col: 12,
          order: 40,

          textAr:
            "سداد الرسمي يحتاج تكاملًا مع بنك أو مزود دفع، ولا يعتمد على إدخال رقم حساب بنكي فقط.",

          textEn:
            "Official SADAD requires integration with a bank or payment provider.",
        },
      ],

      /*
      ===============================================
      General Online Card
      ===============================================
      */

      CARD: onlineMethodFields(),

      /*
      ===============================================
      Electronic Methods
      ===============================================
      */

      MADA: onlineMethodFields(),

      VISA: onlineMethodFields(),

      MASTERCARD: onlineMethodFields(),

      APPLE_PAY: onlineMethodFields(),

      STC_PAY: onlineMethodFields(),

      /*
      ===============================================
      Cash
      ===============================================
      */

      CASH: [
        ...systemFields({
          type: "cash",
          requiresBankAccount: false,
          requiresPaymentProvider: false,
          requiresProofUpload: false,
        }),

        {
          name: "cashInfo",
          labelAr: "الدفع النقدي",
          labelEn: "Cash Payment",
          type: "info",
          col: 12,
          order: 40,

          textAr:
            "لا يحتاج الدفع النقدي إلى حساب بنكي أو مزود دفع إلكتروني.",

          textEn:
            "Cash payment does not require a bank account or online provider.",
        },
      ],

      /*
      ===============================================
      Credit / Deferred Payment
      ===============================================
      */

      CREDIT: [
        ...systemFields({
          type: "credit",
          requiresBankAccount: false,
          requiresPaymentProvider: false,
          requiresProofUpload: false,
        }),

        {
          name: "creditInfo",
          labelAr: "الدفع الآجل",
          labelEn: "Deferred Payment",
          type: "info",
          col: 12,
          order: 40,

          textAr:
            "إتاحة الدفع الآجل في قسم أو منتج ستتم من صفحة ربط طرق الدفع، ويمكن لاحقًا إضافة شروط وحد ائتماني.",

          textEn:
            "Deferred payment availability will be controlled through payment assignments.",
        },
      ],
    },
  };
};
