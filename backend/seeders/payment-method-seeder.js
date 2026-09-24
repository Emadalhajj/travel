/*
بعد إنشاء PaymentMethod، ستكون مجموعة MongoDB فارغة.

لكن النظام يحتاج سجلات أساسية مثل:
BANK_TRANSFER
SADAD
MADA
VISA
MASTERCARD
APPLE_PAY
STC_PAY
CASH
CREDIT
الـ Seeder يقوم بإنشائها تلقائيًا بدل إدخالها يدويًا من MongoDB Compass.

كما أنه يستخدم:

findOneAndUpdate + upsert

*/

// seeders/payment-method-seeder.js

import PaymentMethod from "../models/payments/payment-method-model.js";

import {
  PAYMENT_METHOD_CODES,
} from "../constants/payments/payment-method-codes.js";

const paymentMethods = [
  {
    code:
      PAYMENT_METHOD_CODES.BANK_TRANSFER,

    nameAr: "تحويل بنكي",
    nameEn: "Bank Transfer",

    type: "offline",

    requiresBankAccount: true,

    requiresPaymentProvider: false,

    requiresProofUpload: true,

    sortOrder: 1,
  },

  {
    code: PAYMENT_METHOD_CODES.SADAD,

    nameAr: "سداد",
    nameEn: "SADAD",

    type: "invoice",

    requiresBankAccount: false,

    requiresPaymentProvider: true,

    requiresProofUpload: false,

    sortOrder: 2,
  },

  {
    code: PAYMENT_METHOD_CODES.CARD,

    nameAr: "الدفع الإلكتروني",
    nameEn: "Online Payment",

    type: "online",

    requiresPaymentProvider: true,

    sortOrder: 3,
  },

  {
    code: PAYMENT_METHOD_CODES.MADA,

    nameAr: "مدى",
    nameEn: "Mada",

    type: "online",

    requiresPaymentProvider: true,

    sortOrder: 4,
  },

  {
    code: PAYMENT_METHOD_CODES.VISA,

    nameAr: "فيزا",
    nameEn: "Visa",

    type: "online",

    requiresPaymentProvider: true,

    sortOrder: 5,
  },

  {
    code:
      PAYMENT_METHOD_CODES.MASTERCARD,

    nameAr: "ماستركارد",
    nameEn: "Mastercard",

    type: "online",

    requiresPaymentProvider: true,

    sortOrder: 6,
  },

  {
    code:
      PAYMENT_METHOD_CODES.APPLE_PAY,

    nameAr: "Apple Pay",
    nameEn: "Apple Pay",

    type: "online",

    requiresPaymentProvider: true,

    sortOrder: 7,
  },

  {
    code:
      PAYMENT_METHOD_CODES.STC_PAY,

    nameAr: "STC Pay",
    nameEn: "STC Pay",

    type: "online",

    requiresPaymentProvider: true,

    sortOrder: 8,
  },

  {
    code: PAYMENT_METHOD_CODES.CASH,

    nameAr: "نقداً",
    nameEn: "Cash",

    type: "cash",

    requiresBankAccount: false,

    requiresPaymentProvider: false,

    requiresProofUpload: false,

    sortOrder: 9,
  },

  {
    code: PAYMENT_METHOD_CODES.CREDIT,

    nameAr: "آجل",
    nameEn: "Credit",

    type: "credit",

    requiresBankAccount: false,

    requiresPaymentProvider: false,

    requiresProofUpload: false,

    sortOrder: 10,
  },
];

export const seedPaymentMethods = async ({ execute = false, PaymentMethodModel = PaymentMethod } = {}) => {
  const summary = { mode: execute ? "execute" : "dry-run", scanned: paymentMethods.length, created: 0, unchanged: 0, drifted: 0, failed: 0 };
  for (const method of paymentMethods) {
    const existing = await PaymentMethodModel.findOne({ code: method.code }).lean();
    if (existing) {
      const drifted = Object.entries(method).some(([key, value]) => existing[key] !== value);
      summary[drifted ? "drifted" : "unchanged"] += 1;
      continue;
    }
    if (execute) {
      await PaymentMethodModel.create({ ...method, isActive: true, isDeleted: false });
      summary.created += 1;
    }
  }
  return summary;
};
