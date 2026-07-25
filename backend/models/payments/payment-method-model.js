// models/payments/payment-method-model.js

/*
=====================================================
Payment Method Model
=====================================================

يمثل طريقة دفع متاحة داخل النظام مثل:

- BANK_TRANSFER
- SADAD
- MADA
- VISA
- MASTERCARD
- APPLE_PAY
- STC_PAY
- CASH
- CREDIT

هذا الموديل لا يحدد أين تظهر الطريقة.

ربط الطريقة بقسم أو منتج سيتم لاحقًا داخل:
PaymentConfiguration
=====================================================
*/

import mongoose from "mongoose";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../constants/payments/payment-method-codes.js";

const PAYMENT_METHOD_TYPES = [
  "offline",
  "online",
  "invoice",
  "cash",
  "credit",
];

const paymentMethodSchema =
  new mongoose.Schema(
    {
      /*
      كود ثابت يستخدم داخل البرمجة وقاعدة البيانات.

      مثال:
      BANK_TRANSFER
      MADA
      VISA
      */

      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        enum: PAYMENT_METHOD_CODE_VALUES,
        index: true,
      },

      nameAr: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

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
      offline:
      التحويل البنكي.

      online:
      مدى، Visa، Mastercard، Apple Pay.

      invoice:
      سداد.

      cash:
      الدفع النقدي.

      credit:
      الدفع الآجل.
      */

      type: {
        type: String,
        required: true,
        enum: PAYMENT_METHOD_TYPES,
        trim: true,
        lowercase: true,
        index: true,
      },

      /*
      هل تحتاج الطريقة إلى حساب بنكي؟

      true في حالة:
      BANK_TRANSFER
      */

      requiresBankAccount: {
        type: Boolean,
        default: false,
      },

      /*
      هل تحتاج الطريقة إلى مزود إلكتروني؟

      true في حالة:
      MADA
      VISA
      MASTERCARD
      APPLE_PAY
      STC_PAY
      SADAD الرسمي
      */

      requiresPaymentProvider: {
        type: Boolean,
        default: false,
      },

      /*
      هل يجب رفع إثبات دفع؟

      true غالبًا في التحويل البنكي.
      */

      requiresProofUpload: {
        type: Boolean,
        default: false,
      },

      /*
      اسم أيقونة أو رابط صورة.

      مثال:
      landmark
      credit-card
      /uploads/payment-methods/mada.svg
      */

      icon: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },

      sortOrder: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
      التعطيل العام.

      إذا كانت الطريقة غير مفعلة هنا، فلن تظهر
      في أي قسم أو منتج حتى لو كانت مربوطة به.
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

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
تسريع صفحة الإدارة.
*/

paymentMethodSchema.index({
  isDeleted: 1,
  isActive: 1,
  type: 1,
  sortOrder: 1,
});

/*
تسريع جلب الطرق الفعالة للعميل.
*/

paymentMethodSchema.index({
  isDeleted: 1,
  isActive: 1,
  sortOrder: 1,
});

export default mongoose.model(
  "PaymentMethod",
  paymentMethodSchema,
);