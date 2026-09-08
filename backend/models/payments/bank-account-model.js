// models/payments/bank-account-model.js

/*
=====================================================
Bank Account Model
=====================================================

هذا الموديل مسؤول عن إدارة الحسابات البنكية التي
يمكن للمدير إظهارها للعملاء عند اختيار:

BANK_TRANSFER

يدعم:
-----------------------------------------------------
- إضافة أكثر من حساب بنكي.
- تفعيل وتعطيل الحساب.
- إخفاء الحساب عن العملاء مع بقائه داخل الإدارة.
- تحديد الحساب الافتراضي.
- دعم أكثر من عملة.
- حذف منطقي دون فقد السجلات القديمة.
- ترتيب الحسابات في صفحة الدفع.
=====================================================
*/

import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

/*
=====================================================
Supported Currencies
=====================================================

يمكن نقلها لاحقًا إلى ملف Constants مستقل إذا
استخدمت في موديلات أخرى.
=====================================================
*/

/*
=====================================================
Bank Account Schema
=====================================================
*/

const bankAccountSchema =
  new mongoose.Schema(
    {
      /*
      -------------------------------------------------
      اسم البنك
      -------------------------------------------------
      */

      bankNameAr: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      bankNameEn: {
        type: String,
        default: "",
        trim: true,
        maxlength: 150,
      },

      /*
      -------------------------------------------------
      اسم الحساب
      -------------------------------------------------

      مثال:
      شركة محجر الرمال لخدمات المعتمرين
      */

      accountNameAr: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      accountNameEn: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
      },

      /*
      -------------------------------------------------
      اسم المستفيد
      -------------------------------------------------

      قد يختلف الاسم المسجل لدى البنك عن الاسم
      التجاري الظاهر بالعربية.
      */

      beneficiaryName: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
      },

      /*
      -------------------------------------------------
      رقم الحساب المحلي
      -------------------------------------------------

      ليس مطلوبًا دائمًا إذا كان IBAN متوفرًا.
      */

      accountNumber: {
        type: String,
        default: "",
        trim: true,
        maxlength: 50,
      },

      /*
      -------------------------------------------------
      رقم الآيبان
      -------------------------------------------------

      يتم حفظه بدون مسافات وبأحرف كبيرة.
      */

      iban: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        maxlength: 34,
      },

      /*
      -------------------------------------------------
      SWIFT / BIC
      -------------------------------------------------

      مهم للحوالات الدولية.
      */

      swiftCode: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
        maxlength: 20,
      },

      /*
      -------------------------------------------------
      العملة
      -------------------------------------------------
      */

      currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: DEFAULT_CURRENCY,
        uppercase: true,
        trim: true,
      },

      /*
      -------------------------------------------------
      ملاحظات العميل
      -------------------------------------------------

      مثال:
      يرجى رفع صورة الحوالة بعد التحويل.
      */

      notesAr: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      notesEn: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      /*
      -------------------------------------------------
      شعار البنك
      -------------------------------------------------

      نحفظ الرابط فقط، وليس الملف نفسه.
      */

      logo: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      -------------------------------------------------
      هل الحساب ظاهر للعملاء؟
      -------------------------------------------------

      isActive:
      الحساب صالح للاستخدام داخل النظام.

      isPublic:
      الحساب يظهر في واجهة العميل.

      قد يكون الحساب فعالًا للإدارة لكنه غير ظاهر
      للعملاء.
      */

      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },

      isPublic: {
        type: Boolean,
        default: true,
        index: true,
      },

      /*
      -------------------------------------------------
      الحساب الافتراضي
      -------------------------------------------------

      تستخدمه الواجهة لاختيار الحساب تلقائيًا.
      يجب أن تضمن الخدمة لاحقًا وجود حساب افتراضي
      واحد فقط لكل عملة.
      */

      isDefault: {
        type: Boolean,
        default: false,
        index: true,
      },

      /*
      -------------------------------------------------
      ترتيب العرض
      -------------------------------------------------
      */

      sortOrder: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
      -------------------------------------------------
      Soft Delete
      -------------------------------------------------
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      /*
      -------------------------------------------------
      Audit Metadata
      -------------------------------------------------
      */

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
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
Normalize IBAN
=====================================================

إزالة المسافات والشرطات قبل التحقق والحفظ.

مثال:
SA03 8000 0000 6080 1016 7519

يصبح:
SA0380000000608010167519
=====================================================
*/

bankAccountSchema.pre(
  "validate",
  function normalizeBankAccount(next) {
    if (this.iban) {
      this.iban = String(this.iban)
        .replace(/[\s-]+/g, "")
        .toUpperCase();
    }

    if (this.swiftCode) {
      this.swiftCode = String(
        this.swiftCode,
      )
        .replace(/\s+/g, "")
        .toUpperCase();
    }

    if (this.currency) {
      this.currency = String(
        this.currency,
      ).toUpperCase();
    }

    next();
  },
);

/*
=====================================================
IBAN Validation
=====================================================

هذا تحقق مبدئي من الشكل العام.

لا يثبت أن الحساب موجود فعليًا لدى البنك، لكنه يمنع:
- الرموز غير الصحيحة.
- IBAN القصير جدًا.
- IBAN الأطول من الحد الدولي.
=====================================================
*/

bankAccountSchema.path("iban").validate(
  function validateIban(value) {
    return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(
      value,
    );
  },
  "Invalid IBAN format",
);

/*
=====================================================
Indexes
=====================================================
*/

/*
منع تكرار IBAN بين الحسابات غير المحذوفة.

يسمح بإعادة استخدام نفس IBAN بعد حذف الحساب
حذفًا منطقيًا إذا كان ذلك مطلوبًا.
*/

bankAccountSchema.index(
  {
    iban: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

/*
تسريع جلب الحسابات الظاهرة للعميل.
*/

bankAccountSchema.index({
  isDeleted: 1,
  isActive: 1,
  isPublic: 1,
  currency: 1,
  sortOrder: 1,
});

/*
تسريع قائمة الإدارة.
*/

bankAccountSchema.index({
  isDeleted: 1,
  createdAt: -1,
});

/*
=====================================================
Model
=====================================================
*/

export default mongoose.model(
  "BankAccount",
  bankAccountSchema,
);
