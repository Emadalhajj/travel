/*
=====================================================
Payment Provider Form Config
=====================================================

إعدادات الفورم الذكي الخاص بمزودي الدفع.

يعتمد على:
-----------------------------------------------------
- UniversalForm
- conditionKey
- commonFields
- conditionalFields
- checkbox-group
- nested field paths

لا يحتوي على أي React Component خاص.
=====================================================
*/

/*
=====================================================
Provider Options
=====================================================
*/

const providerCodeOptions = [
  {
    value: "HYPERPAY",
    labelAr: "هايبر باي",
    labelEn: "HyperPay",
  },
  {
    value: "MOYASAR",
    labelAr: "ميسر",
    labelEn: "Moyasar",
  },
  {
    value: "GEIDEA",
    labelAr: "جيديا",
    labelEn: "Geidea",
  },
  {
    value: "PAYTABS",
    labelAr: "بي تابس",
    labelEn: "PayTabs",
  },
  {
    value: "TAP",
    labelAr: "تاب",
    labelEn: "Tap Payments",
  },
  {
    value: "STRIPE",
    labelAr: "سترايب",
    labelEn: "Stripe",
  },
];

/*
=====================================================
Environment Options
=====================================================
*/

const environmentOptions = [
  {
    value: "TEST",
    labelAr: "تجريبي",
    labelEn: "Test",
  },
  {
    value: "LIVE",
    labelAr: "فعلي",
    labelEn: "Live",
  },
];

/*
=====================================================
Supported Payment Methods
=====================================================

يستخدم checkbox-group لأن normalizeForForm
وserializeForApi يدعمان تحويل:

Array ↔ Checkbox Object
=====================================================
*/

const supportedPaymentMethodOptions = [
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
    labelAr: "بطاقات الدفع",
    labelEn: "Cards",
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
    labelAr: "رصيد ائتماني",
    labelEn: "Credit",
  },
];

/*
=====================================================
Credential Field Builder
=====================================================

يساعد على توحيد شكل حقول بيانات الاعتماد.

في وضع التعديل:
-----------------------------------------------------
إذا كانت القيمة محفوظة مسبقًا، يظهر للمستخدم
تنبيه بأن ترك الحقل فارغًا سيبقي القيمة القديمة.
=====================================================
*/

const credentialField = ({
  name,
  labelAr,
  labelEn,
  credentialStatus = {},
  mode = "create",
  required = false,
  type = "password",
  order = 60,
}) => {
  const credentialKey = name.split(".").pop();

  const isConfigured = Boolean(credentialStatus?.[credentialKey]);

  const mustEnterValue = required && (mode !== "edit" || !isConfigured);

  return {
    name,

    labelAr,

    labelEn,

    type,

    col: 6,

    order,

    required: mustEnterValue,

    autoComplete: "new-password",

    placeholderAr:
      mode === "edit" && isConfigured
        ? "اترك الحقل فارغًا للاحتفاظ بالقيمة الحالية"
        : "",

    placeholderEn:
      mode === "edit" && isConfigured
        ? "Leave blank to keep the current value"
        : "",

    helpTextAr:
      mode === "edit" && isConfigured
        ? "تم إعداد هذه القيمة مسبقًا، ولن يتم تغييرها ما لم تدخل قيمة جديدة."
        : "",

    helpTextEn:
      mode === "edit" && isConfigured
        ? "This value is already configured and will only change if you enter a new value."
        : "",
  };
};

/*
=====================================================
Credentials Information
=====================================================
*/

const credentialsInfoField = {
  name: "credentialsInfo",

  type: "info",

  labelAr: "بيانات الاتصال السرية",

  labelEn: "Secure Credentials",

  textAr:
    "يتم حفظ بيانات الاعتماد بشكل آمن، ولا تظهر قيمها الحقيقية بعد الحفظ.",

  textEn:
    "Credentials are stored securely and their real values are never displayed after saving.",

  col: 12,

  order: 50,
};

/*
=====================================================
HyperPay Fields
=====================================================
*/

const hyperPayFields = ({ mode, credentialStatus }) => [
  credentialsInfoField,

  credentialField({
    name: "credentials.entityId",

    labelAr: "Entity ID",

    labelEn: "Entity ID",

    credentialStatus,

    mode,

    required: true,

    type: "text",

    order: 60,
  }),

  credentialField({
    name: "credentials.accessToken",

    labelAr: "Access Token",

    labelEn: "Access Token",

    credentialStatus,

    mode,

    required: true,

    order: 61,
  }),

  credentialField({
    name: "credentials.webhookSecret",

    labelAr: "Webhook Secret",

    labelEn: "Webhook Secret",

    credentialStatus,

    mode,

    order: 62,
  }),
];

/*
=====================================================
Moyasar Fields
=====================================================
*/

const moyasarFields = ({ mode, credentialStatus }) => [
  credentialsInfoField,

  credentialField({
    name: "credentials.publishableKey",

    labelAr: "المفتاح العام",

    labelEn: "Publishable Key",

    credentialStatus,

    mode,

    required: true,

    type: "text",

    order: 60,
  }),

  credentialField({
    name: "credentials.secretKey",

    labelAr: "المفتاح السري",

    labelEn: "Secret Key",

    credentialStatus,

    mode,

    required: true,

    order: 61,
  }),

  credentialField({
    name: "credentials.webhookSecret",

    labelAr: "Webhook Secret",

    labelEn: "Webhook Secret",

    credentialStatus,

    mode,

    order: 62,
  }),
];

/*
=====================================================
Geidea Fields
=====================================================
*/

const geideaFields = ({ mode, credentialStatus }) => [
  credentialsInfoField,

  credentialField({
    name: "credentials.merchantId",

    labelAr: "معرّف التاجر",

    labelEn: "Merchant ID",

    credentialStatus,

    mode,

    required: true,

    type: "text",

    order: 60,
  }),

  credentialField({
    name: "credentials.apiKey",

    labelAr: "API Key",

    labelEn: "API Key",

    credentialStatus,

    mode,

    required: true,

    order: 61,
  }),

  credentialField({
    name: "credentials.webhookSecret",

    labelAr: "Webhook Secret",

    labelEn: "Webhook Secret",

    credentialStatus,

    mode,

    order: 62,
  }),
];

/*
=====================================================
PayTabs Fields
=====================================================
*/

const payTabsFields = ({ mode, credentialStatus }) => [
  credentialsInfoField,

  credentialField({
    name: "credentials.profileId",

    labelAr: "Profile ID",

    labelEn: "Profile ID",

    credentialStatus,

    mode,

    required: true,

    type: "text",

    order: 60,
  }),

  credentialField({
    name: "credentials.serverKey",

    labelAr: "Server Key",

    labelEn: "Server Key",

    credentialStatus,

    mode,

    required: true,

    order: 61,
  }),

  credentialField({
    name: "credentials.clientKey",

    labelAr: "Client Key",

    labelEn: "Client Key",

    credentialStatus,

    mode,

    type: "text",

    order: 62,
  }),
];

/*
=====================================================
Tap Fields
=====================================================
*/

const tapFields = ({ mode, credentialStatus }) => [
  credentialsInfoField,

  credentialField({
    name: "credentials.publishableKey",

    labelAr: "المفتاح العام",

    labelEn: "Publishable Key",

    credentialStatus,

    mode,

    type: "text",

    order: 60,
  }),

  credentialField({
    name: "credentials.secretKey",

    labelAr: "المفتاح السري",

    labelEn: "Secret Key",

    credentialStatus,

    mode,

    required: true,

    order: 61,
  }),

  credentialField({
    name: "credentials.webhookSecret",

    labelAr: "Webhook Secret",

    labelEn: "Webhook Secret",

    credentialStatus,

    mode,

    order: 62,
  }),
];

/*
=====================================================
Stripe Fields
=====================================================
*/

const stripeFields = ({ mode, credentialStatus }) => [
  credentialsInfoField,

  credentialField({
    name: "credentials.publishableKey",

    labelAr: "المفتاح العام",

    labelEn: "Publishable Key",

    credentialStatus,

    mode,

    required: false,

    type: "text",

    order: 60,
  }),

  credentialField({
    name: "credentials.secretKey",

    labelAr: "المفتاح السري",

    labelEn: "Secret Key",

    credentialStatus,

    mode,

    required: true,

    order: 61,
  }),

  credentialField({
    name: "credentials.webhookSecret",

    labelAr: "Webhook Secret",

    labelEn: "Webhook Secret",

    credentialStatus,

    mode,

    required: true,

    order: 62,
  }),
];

/*
=====================================================
Payment Provider Form Config
=====================================================
*/

export const paymentProviderFormConfig = ({
  mode = "create",

  credentialStatus = {},
} = {}) => ({
  /*
    الحقل الذي يحدد مجموعة Credentials الظاهرة.
    */

  conditionKey: "code",

  /*
    الحقول المشتركة بين جميع المزودين.
    */

  commonFields: [
    {
      name: "code",

      labelAr: "مزود الدفع",

      labelEn: "Payment Provider",

      type: "select",

      options: providerCodeOptions,

      col: 6,

      order: 1,

      required: true,

      /*
        يمكن منع تغيير الكود أثناء التعديل
        إن كان UniversalForm يدعم disabled.
        */

      disabled: mode === "edit",
    },

    {
      name: "environment",

      labelAr: "بيئة التشغيل",

      labelEn: "Environment",

      type: "select",

      options: environmentOptions,

      col: 6,

      order: 2,

      required: true,

      defaultValue: "TEST",
    },

    {
      name: "nameAr",

      labelAr: "الاسم بالعربية",

      labelEn: "Arabic Name",

      type: "text",

      col: 6,

      order: 10,

      required: true,
    },

    {
      name: "nameEn",

      labelAr: "الاسم بالإنجليزية",

      labelEn: "English Name",

      type: "text",

      col: 6,

      order: 10,

      required: true,
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
      name: "baseUrl",

      labelAr: "رابط خدمة المزود",

      labelEn: "Provider Base URL",

      type: "text",

      col: 8,

      order: 30,

      required: true,

      placeholderAr: "https://example-provider.com",

      placeholderEn: "https://example-provider.com",
    },

    {
      name: "icon",

      labelAr: "رابط أو اسم الأيقونة",

      labelEn: "Icon Name or URL",

      type: "text",

      col: 4,

      order: 30,
    },

    {
      name: "supportedPaymentMethods",

      labelAr: "طرق الدفع المدعومة",

      labelEn: "Supported Payment Methods",

      type: "checkbox-group",

      options: supportedPaymentMethodOptions,

      col: 12,

      order: 40,

      required: true,
    },

    {
      name: "sortOrder",

      labelAr: "ترتيب العرض",

      labelEn: "Sort Order",

      type: "number",

      min: 0,

      defaultValue: 0,

      col: 6,

      order: 90,
    },

    {
      name: "isActive",

      labelAr: "مزود الدفع مفعّل",

      labelEn: "Provider Active",

      type: "checkbox",

      defaultValue: true,

      col: 6,

      order: 100,
    },
  ],

  /*
    الحقول الخاصة بكل مزود.
    */

  conditionalFields: {
    HYPERPAY: hyperPayFields({
      mode,

      credentialStatus,
    }),

    MOYASAR: moyasarFields({
      mode,

      credentialStatus,
    }),

    GEIDEA: geideaFields({
      mode,

      credentialStatus,
    }),

    PAYTABS: payTabsFields({
      mode,

      credentialStatus,
    }),

    TAP: tapFields({
      mode,

      credentialStatus,
    }),

    STRIPE: stripeFields({
      mode,

      credentialStatus,
    }),
  },
});
