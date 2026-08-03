/*
=====================================================
Payment Provider Model
=====================================================

يمثل مزود الدفع الإلكتروني داخل النظام.

أمثلة:
-----------------------------------------------------
- HyperPay
- Moyasar
- Geidea
- PayTabs
- Tap
- Stripe

هذا الموديل لا يحدد الأقسام أو المنتجات التي
سيظهر فيها المزود.

الربط سيتم لاحقًا داخل:

PaymentConfiguration
=====================================================
*/

import mongoose from "mongoose";

import {
  PAYMENT_PROVIDER_CODE_VALUES,
} from "../../constants/payments/payment-provider-codes.js";

import {
  PAYMENT_PROVIDER_ENVIRONMENT_VALUES,
} from "../../constants/payments/payment-provider-environments.js";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../constants/payments/payment-method-codes.js";

/*
=====================================================
Credential Schema
=====================================================

يحتوي بيانات الاتصال الحساسة مع مزود الدفع.

استخدمنا Schema مستقلًا داخل PaymentProvider لأن
كل مزود قد يحتاج حقولًا مختلفة.

مهم:
-----------------------------------------------------
select: false

يمنع إرجاع هذه البيانات تلقائيًا عند تنفيذ:

PaymentProvider.find()
PaymentProvider.findOne()
=====================================================
*/

const paymentProviderCredentialsSchema =
  new mongoose.Schema(
    {
      /*
      HyperPay
      */

      entityId: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      accessToken: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      webhookSecret: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      /*
      Stripe وبعض المزودين الآخرين
      */

      publishableKey: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      secretKey: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      /*
      Moyasar
      */

      apiKey: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      /*
      Geidea / PayTabs / Tap
      */

      merchantId: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      terminalId: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      profileId: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      serverKey: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },

      clientKey: {
        type: String,
        trim: true,
        default: "",

        select: false,
      },
    },
    {
      /*
      لا نريد _id مستقلًا داخل credentials.
      */

      _id: false,
    },
  );

/*
=====================================================
Payment Provider Schema
=====================================================
*/

const paymentProviderSchema =
  new mongoose.Schema(
    {
      /*
      كود ثابت يستخدم داخل النظام.

      مثال:
      HYPERPAY
      MOYASAR
      STRIPE
      */

      code: {
        type: String,

        required: true,

        unique: true,

        uppercase: true,

        trim: true,

        enum:
          PAYMENT_PROVIDER_CODE_VALUES,

        index: true,
      },

      /*
      الاسم المعروض في الواجهة العربية.
      */

      nameAr: {
        type: String,

        required: true,

        trim: true,

        maxlength: 150,
      },

      /*
      الاسم المعروض في الواجهة الإنجليزية.
      */

      nameEn: {
        type: String,

        required: true,

        trim: true,

        maxlength: 150,
      },

      descriptionAr: {
        type: String,

        default: "",

        trim: true,

        maxlength: 1000,
      },

      descriptionEn: {
        type: String,

        default: "",

        trim: true,

        maxlength: 1000,
      },

      /*
      بيئة تشغيل المزود.

      TEST:
      للاختبارات.

      LIVE:
      للدفع الفعلي.
      */

      environment: {
        type: String,

        required: true,

        uppercase: true,

        trim: true,

        enum:
          PAYMENT_PROVIDER_ENVIRONMENT_VALUES,

        default: "TEST",

        index: true,
      },

      /*
      رابط API الأساسي الخاص بالمزود.

      مثال HyperPay TEST:
      https://eu-test.oppwa.com

      مثال HyperPay LIVE:
      يحدد حسب البيانات التي يقدمها المزود.
      */

      baseUrl: {
        type: String,

        required: true,

        trim: true,

        maxlength: 1000,
      },

      /*
      بيانات الاتصال الحساسة.

      لا يتم إرجاع الحقول تلقائيًا لأن كل حقل داخل
      credentials يحتوي select: false.
      */

      credentials: {
        type:
          paymentProviderCredentialsSchema,

        default: () => ({}),
      },

      /*
      طرق الدفع التي يدعمها المزود.

      مثال HyperPay:

      [
        "CARD",
        "MADA",
        "VISA",
        "MASTERCARD",
        "APPLE_PAY",
        "STC_PAY"
      ]
      */

      supportedPaymentMethods: [
        {
          type: String,

          uppercase: true,

          trim: true,

          enum:
            PAYMENT_METHOD_CODE_VALUES,
        },
      ],

      /*
      رقم أو رابط أيقونة المزود.
      */

      icon: {
        type: String,

        default: "",

        trim: true,

        maxlength: 500,
      },

      /*
      ترتيب ظهور المزود في لوحة الإدارة
      والقوائم التي ستستخدمه لاحقًا.
      */

      sortOrder: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      التفعيل العام للمزود.

      إذا كان false فلن يسمح Payment Resolver
      باستخدام هذا المزود.
      */

      isActive: {
        type: Boolean,

        default: true,

        index: true,
      },

      /*
      Soft Delete
      */

      isDeleted: {
        type: Boolean,

        default: false,

        index: true,
      },

      deletedAt: {
        type: Date,

        default: null,
      },

      deletedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      updatedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },
    },
    {
      timestamps: true,
    },
  );

/*
=====================================================
Administration Index
=====================================================

يسرع عمليات:

- عرض القائمة.
- فلترة البيئة.
- فلترة الحالة.
- ترتيب النتائج.
=====================================================
*/

paymentProviderSchema.index({
  isDeleted: 1,
  isActive: 1,
  environment: 1,
  sortOrder: 1,
});

/*
=====================================================
Active Provider Index
=====================================================

سيستخدم لاحقًا عند جلب المزودين المتاحين
داخل PaymentConfiguration وPayment Resolver.
=====================================================
*/

paymentProviderSchema.index({
  isDeleted: 1,

  isActive: 1,

  code: 1,
});

/*
=====================================================
Normalize Before Validation
=====================================================

توحيد القيم قبل الحفظ.
=====================================================
*/

paymentProviderSchema.pre(
  "validate",

  function normalizeProviderData(
    next,
  ) {
    if (this.code) {
      this.code = String(
        this.code,
      )
        .trim()
        .toUpperCase();
    }

    if (this.environment) {
      this.environment = String(
        this.environment,
      )
        .trim()
        .toUpperCase();
    }

    if (
      Array.isArray(
        this.supportedPaymentMethods,
      )
    ) {
      this.supportedPaymentMethods =
        [
          ...new Set(
            this.supportedPaymentMethods
              .filter(Boolean)
              .map((method) =>
                String(method)
                  .trim()
                  .toUpperCase(),
              ),
          ),
        ];
    }

    next();
  },
);

export default mongoose.model(
  "PaymentProvider",

  paymentProviderSchema,
);