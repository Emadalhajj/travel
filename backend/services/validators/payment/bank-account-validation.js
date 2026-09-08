// validations/payment/bank-account-validation.js

/*
=====================================================
Bank Account Validation
=====================================================

هذا الملف مسؤول عن التحقق من البيانات قبل وصولها
إلى Service أو قاعدة البيانات.

نستخدم Joi حتى:
-----------------------------------------------------
- نمنع البيانات الناقصة.
- نمنع العملات غير المدعومة.
- نتحقق من تنسيق IBAN.
- نمنع القيم غير الصحيحة.
=====================================================
*/

import Joi from "joi";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../../constants/currencies.js";

/*
=====================================================
Constants
=====================================================
*/

/*
=====================================================
IBAN Validation
=====================================================

التحقق هنا مبدئي من الشكل العام:

- يبدأ بحرفين للدولة.
- ثم رقمين للتحقق.
- ثم حروف وأرقام.
- الطول بين 15 و34 حرفًا.

ملاحظة:
هذا لا يؤكد وجود الحساب فعليًا لدى البنك.
=====================================================
*/

const ibanSchema = Joi.string()
  .trim()
  .replace(/[\s-]+/g, "")
  .uppercase()
  .pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/)
  .messages({
    "string.pattern.base":
      "رقم الآيبان غير صحيح",
  });

/*
=====================================================
Create Bank Account Schema
=====================================================
*/

export const createBankAccountSchema =
  Joi.object({
    bankNameAr: Joi.string()
      .trim()
      .min(2)
      .max(150)
      .required(),

    bankNameEn: Joi.string()
      .trim()
      .allow("")
      .max(150)
      .default(""),

    accountNameAr: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .required(),

    accountNameEn: Joi.string()
      .trim()
      .allow("")
      .max(200)
      .default(""),

    beneficiaryName: Joi.string()
      .trim()
      .allow("")
      .max(200)
      .default(""),

    accountNumber: Joi.string()
      .trim()
      .allow("")
      .max(50)
      .default(""),

    iban: ibanSchema.required(),

    swiftCode: Joi.string()
      .trim()
      .allow("")
      .uppercase()
      .max(20)
      .default(""),

    currency: Joi.string()
      .uppercase()
      .valid(...SUPPORTED_CURRENCIES)
      .default(DEFAULT_CURRENCY),

    notesAr: Joi.string()
      .trim()
      .allow("")
      .max(1000)
      .default(""),

    notesEn: Joi.string()
      .trim()
      .allow("")
      .max(1000)
      .default(""),

    logo: Joi.string()
      .trim()
      .allow("")
      .max(500)
      .default(""),

    isActive: Joi.boolean().default(true),

    isPublic: Joi.boolean().default(true),

    isDefault: Joi.boolean().default(false),

    sortOrder: Joi.number()
      .integer()
      .min(0)
      .default(0),
  });

/*
=====================================================
Update Bank Account Schema
=====================================================

جميع الحقول اختيارية؛ لأن PATCH قد يعدل حقلًا واحدًا.
=====================================================
*/

export const updateBankAccountSchema =
  Joi.object({
    bankNameAr: Joi.string()
      .trim()
      .min(2)
      .max(150),

    bankNameEn: Joi.string()
      .trim()
      .allow("")
      .max(150),

    accountNameAr: Joi.string()
      .trim()
      .min(2)
      .max(200),

    accountNameEn: Joi.string()
      .trim()
      .allow("")
      .max(200),

    beneficiaryName: Joi.string()
      .trim()
      .allow("")
      .max(200),

    accountNumber: Joi.string()
      .trim()
      .allow("")
      .max(50),

    iban: ibanSchema,

    swiftCode: Joi.string()
      .trim()
      .allow("")
      .uppercase()
      .max(20),

    currency: Joi.string()
      .uppercase()
      .valid(...SUPPORTED_CURRENCIES),

    notesAr: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    notesEn: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    logo: Joi.string()
      .trim()
      .allow("")
      .max(500),

    isActive: Joi.boolean(),

    isPublic: Joi.boolean(),

    isDefault: Joi.boolean(),

    sortOrder: Joi.number()
      .integer()
      .min(0),
  }).min(1);

/*
=====================================================
Status Schema
=====================================================

تستخدم لتغيير:
- isActive
- isPublic
- isDefault
=====================================================
*/

export const updateBankAccountStatusSchema =
  Joi.object({
    isActive: Joi.boolean(),

    isPublic: Joi.boolean(),

    isDefault: Joi.boolean(),
  }).min(1);

/*
=====================================================
Validation Helper
=====================================================

ترجع البيانات بعد تنظيفها، أو ترمي خطأ يحتوي
تفاصيل Joi.
=====================================================
*/

export const validateBankAccountData = ({
  schema,
  data,
}) => {
  const { value, error } = schema.validate(
    data,
    {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    },
  );

  if (error) {
    const validationError = new Error(
      error.details
        .map((item) => item.message)
        .join(", "),
    );

    validationError.statusCode = 400;
    validationError.field =
      error.details?.[0]?.path?.join(".") ||
      "validation";

    throw validationError;
  }

  return value;
};
