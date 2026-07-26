// validations/payment/payment-method-validation.js

/*
=====================================================
Payment Method Validation
=====================================================

يتحقق من البيانات القادمة من لوحة الإدارة قبل
تمريرها إلى Service أو Mongoose.
=====================================================
*/

import Joi from "joi";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../../constants/payments/payment-method-codes.js";

const PAYMENT_METHOD_TYPES = [
  "offline",
  "online",
  "invoice",
  "cash",
  "credit",
];

/*
=====================================================
Create Schema
=====================================================
*/

export const createPaymentMethodSchema =
  Joi.object({
    code: Joi.string()
      .trim()
      .uppercase()
      .valid(
        ...PAYMENT_METHOD_CODE_VALUES,
      )
      .required()
      .messages({
        "any.required":
          "كود طريقة الدفع مطلوب",

        "any.only":
          "كود طريقة الدفع غير مدعوم",
      }),

    nameAr: Joi.string()
      .trim()
      .min(2)
      .max(150)
      .required(),

    nameEn: Joi.string()
      .trim()
      .min(2)
      .max(150)
      .required(),

    descriptionAr: Joi.string()
      .trim()
      .allow("")
      .max(1000)
      .default(""),

    descriptionEn: Joi.string()
      .trim()
      .allow("")
      .max(1000)
      .default(""),

    type: Joi.string()
      .trim()
      .lowercase()
      .valid(...PAYMENT_METHOD_TYPES)
      .required(),

    requiresBankAccount:
      Joi.boolean().default(false),

    requiresPaymentProvider:
      Joi.boolean().default(false),

    requiresProofUpload:
      Joi.boolean().default(false),

    icon: Joi.string()
      .trim()
      .allow("")
      .max(500)
      .default(""),

    sortOrder: Joi.number()
      .integer()
      .min(0)
      .default(0),

    isActive:
      Joi.boolean().default(true),
  });

/*
=====================================================
Update Schema
=====================================================

جميع الحقول اختيارية لأن PATCH قد يحدث حقلًا واحدًا.
=====================================================
*/

export const updatePaymentMethodSchema =
  Joi.object({
    code: Joi.string()
      .trim()
      .uppercase()
      .valid(
        ...PAYMENT_METHOD_CODE_VALUES,
      ),

    nameAr: Joi.string()
      .trim()
      .min(2)
      .max(150),

    nameEn: Joi.string()
      .trim()
      .min(2)
      .max(150),

    descriptionAr: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    descriptionEn: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    type: Joi.string()
      .trim()
      .lowercase()
      .valid(...PAYMENT_METHOD_TYPES),

    requiresBankAccount:
      Joi.boolean(),

    requiresPaymentProvider:
      Joi.boolean(),

    requiresProofUpload:
      Joi.boolean(),

    icon: Joi.string()
      .trim()
      .allow("")
      .max(500),

    sortOrder: Joi.number()
      .integer()
      .min(0),

    isActive: Joi.boolean(),
  }).min(1);

/*
=====================================================
Status Schema
=====================================================

تستخدم عند الضغط على تفعيل أو تعطيل من الجدول.
=====================================================
*/

export const updatePaymentMethodStatusSchema =
  Joi.object({
    isActive:
      Joi.boolean().required(),
  });

/*
=====================================================
Validation Helper
=====================================================
*/

export const validatePaymentMethodData = ({
  schema,
  data,
}) => {
  const {
    value,
    error,
  } = schema.validate(
    data,
    {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    },
  );

  if (!error) {
    return value;
  }

  const validationError =
    new Error(
      error.details
        .map(
          (item) =>
            item.message,
        )
        .join(", "),
    );

  validationError.statusCode = 400;

  validationError.field =
    error.details?.[0]?.path?.join(
      ".",
    ) || "validation";

  validationError.errors =
    error.details.reduce(
      (result, item) => {
        const field =
          item.path.join(".");

        result[field] =
          item.message;

        return result;
      },
      {},
    );

  throw validationError;
};
