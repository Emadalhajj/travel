/*
=====================================================
Payment Configuration Model
=====================================================

يربط بين:

- القسم
- طريقة الدفع
- مزود الدفع
- الحسابات البنكية

السجل الواحد يمثل طريقة دفع واحدة داخل قسم واحد.
=====================================================
*/

import mongoose from "mongoose";

import { PAYMENT_SECTION_CODE_VALUES } from "../../constants/payments/payment-section-codes.js";

import {
  PAYMENT_CONFIGURATION_TYPE_VALUES,
  PAYMENT_CONFIGURATION_TYPES,
} from "../../constants/payments/payment-configuration-types.js";

import { PAYMENT_METHOD_CODE_VALUES } from "../../constants/payments/payment-method-codes.js";

const { Schema, model } = mongoose;

/*
=====================================================
Payment Configuration Schema
=====================================================
*/

const paymentConfigurationSchema = new Schema(
  {
    /*
      ===============================================
      Section
      ===============================================

      القسم الذي ستظهر فيه طريقة الدفع.
      */

    sectionCode: {
      type: String,

      enum: PAYMENT_SECTION_CODE_VALUES,

      required: true,

      trim: true,

      uppercase: true,

      index: true,
    },

    /*
      ===============================================
      Payment Method
      ===============================================

      الكود الذي يختاره العميل مثل:

      BANK_TRANSFER
      MADA
      VISA
      APPLE_PAY
      */

    paymentMethodCode: {
      type: String,

      enum: PAYMENT_METHOD_CODE_VALUES,

      required: true,

      trim: true,

      uppercase: true,

      index: true,
    },

    /*
      ===============================================
      Configuration Type
      ===============================================

      PROVIDER:
      يحتاج PaymentProvider.

      BANK_ACCOUNT:
      يحتاج BankAccount.

      MANUAL:
      لا يحتاج أي ربط خارجي.
      */

    configurationType: {
      type: String,

      enum: PAYMENT_CONFIGURATION_TYPE_VALUES,

      required: true,

      default: PAYMENT_CONFIGURATION_TYPES.MANUAL,

      trim: true,

      uppercase: true,

      index: true,
    },

    /*
      ===============================================
      Provider
      ===============================================

      يستخدم فقط عندما يكون:

      configurationType = PROVIDER
      */

    providerId: {
      type: Schema.Types.ObjectId,

      ref: "PaymentProvider",

      default: null,

      index: true,
    },

    /*
      ===============================================
      Bank Accounts
      ===============================================

      يستخدم فقط عندما يكون:

      configurationType = BANK_ACCOUNT

      نسمح بأكثر من حساب حتى يمكن للعميل اختيار
      الحساب المناسب.
      */

    bankAccountIds: [
      {
        type: Schema.Types.ObjectId,

        ref: "BankAccount",
      },
    ],

    /*
      ===============================================
      Currency
      ===============================================

      حاليًا يمكن ضبط طريقة الدفع حسب العملة.

      مثال:
      HyperPay SAR
      مزود آخر USD

      null أو مصفوفة فارغة تعني جميع العملات.
      */

    supportedCurrencies: [
      {
        type: String,

        trim: true,

        uppercase: true,
      },
    ],

    /*
      ===============================================
      Display Names
      ===============================================

      اختياري.

      يسمح بتخصيص الاسم الظاهر داخل قسم معين دون
      تعديل اسم PaymentMethod الأساسي.

      مثال:
      "الدفع الفوري بواسطة مدى"
      */

    displayNameAr: {
      type: String,

      trim: true,

      default: "",
    },

    displayNameEn: {
      type: String,

      trim: true,

      default: "",
    },

    /*
      ===============================================
      Instructions
      ===============================================

      تستخدم خصوصًا للتحويل البنكي أو الطرق اليدوية.
      */

    instructionsAr: {
      type: String,

      trim: true,

      default: "",
    },

    instructionsEn: {
      type: String,

      trim: true,

      default: "",
    },

    /*
      ===============================================
      Customer Attachment
      ===============================================

      مثال:
      التحويل البنكي يحتاج رفع إيصال.

      لا نجعل هذا السلوك خاصًا بالكود داخل الواجهة؛
      بل يتحكم به الإعداد.
      */

    requiresAttachment: {
      type: Boolean,

      default: false,
    },

    /*
      ===============================================
      Reference Requirement
      ===============================================

      مثال:
      رقم الحوالة أو الرقم المرجعي.
      */

    requiresReference: {
      type: Boolean,

      default: false,
    },

    /*
      ===============================================
      Amount Rules
      ===============================================
      */

    minimumAmount: {
      type: Number,

      min: 0,

      default: null,
    },

    maximumAmount: {
      type: Number,

      min: 0,

      default: null,
    },

    /*
      ===============================================
      Availability
      ===============================================

      يمكن لاحقًا ضبط نافذة زمنية لتوفر الطريقة.
      */

    availableFrom: {
      type: Date,

      default: null,
    },

    availableUntil: {
      type: Date,

      default: null,
    },

    /*
      ===============================================
      Display Order
      ===============================================
      */

    sortOrder: {
      type: Number,

      min: 0,

      default: 0,

      index: true,
    },

    /*
      ===============================================
      Status
      ===============================================
      */

    isActive: {
      type: Boolean,

      default: true,

      index: true,
    },

    /*
      ===============================================
      Soft Delete
      ===============================================
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
      type: Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    /*
      ===============================================
      Audit Users
      ===============================================
      */

    createdBy: {
      type: Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },
  },
  {
    timestamps: true,

    versionKey: false,
  },
);

/*
=====================================================
Indexes
=====================================================

لا يسمح بتكرار نفس طريقة الدفع داخل نفس القسم.

مثال ممنوع:
-----------------------------------------------------
CUSTOM_PACKAGE + MADA
CUSTOM_PACKAGE + MADA

لكن مسموح:
-----------------------------------------------------
CUSTOM_PACKAGE + MADA
PROGRAM_BOOKING + MADA
=====================================================
*/

paymentConfigurationSchema.index(
  {
    sectionCode: 1,

    paymentMethodCode: 1,

    isDeleted: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

/*
ترتيب جلب الخيارات العامة.
*/

paymentConfigurationSchema.index({
  sectionCode: 1,

  isActive: 1,

  isDeleted: 1,

  sortOrder: 1,
});

/*
=====================================================
Normalize Hook
=====================================================
*/

paymentConfigurationSchema.pre(
  "validate",
  function normalizePaymentConfiguration(next) {
    if (this.sectionCode) {
      this.sectionCode = String(this.sectionCode).trim().toUpperCase();
    }

    if (this.paymentMethodCode) {
      this.paymentMethodCode = String(this.paymentMethodCode)
        .trim()
        .toUpperCase();
    }

    if (this.configurationType) {
      this.configurationType = String(this.configurationType)
        .trim()
        .toUpperCase();
    }

    if (Array.isArray(this.supportedCurrencies)) {
      this.supportedCurrencies = [
        ...new Set(
          this.supportedCurrencies
            .filter(Boolean)
            .map((currency) => String(currency).trim().toUpperCase()),
        ),
      ];
    }

    if (Array.isArray(this.bankAccountIds)) {
      /*
      إزالة الحسابات المكررة.
      */

      const uniqueIds = new Map();

      this.bankAccountIds.forEach((accountId) => {
        if (!accountId) {
          return;
        }

        uniqueIds.set(String(accountId), accountId);
      });

      this.bankAccountIds = Array.from(uniqueIds.values());
    }

    next();
  },
);

/*
=====================================================
Conditional Validation
=====================================================

هذه الحماية موجودة في Model كطبقة أخيرة.

التحقق التفصيلي سيبقى داخل Joi وService.
=====================================================
*/

paymentConfigurationSchema.pre(
  "validate",
  function validateConfigurationRelations(next) {
    const type = this.configurationType;

    if (type === PAYMENT_CONFIGURATION_TYPES.PROVIDER) {
      if (!this.providerId) {
        return next(new Error("يجب تحديد مزود الدفع للطريقة الإلكترونية"));
      }

      /*
      المزود الإلكتروني لا يستخدم الحسابات البنكية.
      */

      this.bankAccountIds = [];
    }

    if (type === PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT) {
      if (
        !Array.isArray(this.bankAccountIds) ||
        this.bankAccountIds.length === 0
      ) {
        return next(new Error("يجب تحديد حساب بنكي واحد على الأقل"));
      }

      /*
      التحويل البنكي لا يستخدم PaymentProvider.
      */

      this.providerId = null;
    }

    if (type === PAYMENT_CONFIGURATION_TYPES.MANUAL) {
      this.providerId = null;

      this.bankAccountIds = [];
    }

    if (
      this.minimumAmount !== null &&
      this.maximumAmount !== null &&
      this.minimumAmount > this.maximumAmount
    ) {
      return next(
        new Error("الحد الأدنى للمبلغ لا يمكن أن يكون أكبر من الحد الأعلى"),
      );
    }

    if (
      this.availableFrom &&
      this.availableUntil &&
      this.availableFrom > this.availableUntil
    ) {
      return next(
        new Error("تاريخ بداية الإتاحة لا يمكن أن يكون بعد تاريخ النهاية"),
      );
    }

    next();
  },
);

const PaymentConfiguration = model(
  "PaymentConfiguration",

  paymentConfigurationSchema,
);

export default PaymentConfiguration;
