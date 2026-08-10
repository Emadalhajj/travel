/*
=====================================================
Payment Provider Validation
=====================================================

يتحقق من بيانات مزود الدفع القادمة من لوحة الإدارة
قبل تمريرها إلى Service أو Mongoose.
=====================================================
*/

import Joi from "joi";

import {
  PAYMENT_PROVIDER_CODE_VALUES,
} from "../../../constants/payments/payment-provider-codes.js";

import {
  PAYMENT_PROVIDER_ENVIRONMENT_VALUES,
} from "../../../constants/payments/payment-provider-environments.js";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../../constants/payments/payment-method-codes.js";

/*
=====================================================
URL Validation
=====================================================

يسمح فقط بروابط HTTP وHTTPS.
=====================================================
*/

const baseUrlSchema =
  Joi.string()
    .trim()
    .uri({
      scheme: [
        "http",

        "https",
      ],
    })
    .max(1000);

/*
=====================================================
Credentials Schema
=====================================================

جميع الحقول اختيارية على المستوى العام لأن الحقول
المطلوبة تختلف حسب provider code.

سيتم تطبيق شروط كل مزود بعد Validation العام.
=====================================================
*/

const credentialsSchema =
  Joi.object({
    entityId: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    accessToken: Joi.string()
      .trim()
      .allow("")
      .max(5000),

    webhookSecret: Joi.string()
      .trim()
      .allow("")
      .max(5000),

    publishableKey: Joi.string()
      .trim()
      .allow("")
      .max(5000),

    secretKey: Joi.string()
      .trim()
      .allow("")
      .max(5000),

    apiKey: Joi.string()
      .trim()
      .allow("")
      .max(5000),

    merchantId: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    terminalId: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    profileId: Joi.string()
      .trim()
      .allow("")
      .max(1000),

    serverKey: Joi.string()
      .trim()
      .allow("")
      .max(5000),

    clientKey: Joi.string()
      .trim()
      .allow("")
      .max(5000),
  })
    .default({})
    .unknown(false);

/*
=====================================================
Common Fields
=====================================================
*/

const commonPaymentProviderFields =
  {
    code: Joi.string()
      .trim()
      .uppercase()
      .valid(
        ...PAYMENT_PROVIDER_CODE_VALUES,
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

    environment: Joi.string()
      .trim()
      .uppercase()
      .valid(
        ...PAYMENT_PROVIDER_ENVIRONMENT_VALUES,
      ),

    baseUrl: baseUrlSchema,

    credentials:
      credentialsSchema,

    supportedPaymentMethods:
      Joi.array()
        .items(
          Joi.string()
            .trim()
            .uppercase()
            .valid(
              ...PAYMENT_METHOD_CODE_VALUES,
            ),
        )
        .unique()
        .default([]),

    icon: Joi.string()
      .trim()
      .allow("")
      .max(500),

    sortOrder: Joi.number()
      .integer()
      .min(0),

    isActive: Joi.boolean(),
  };

/*
=====================================================
Create Schema
=====================================================
*/

export const createPaymentProviderSchema =
  Joi.object({
    ...commonPaymentProviderFields,

    code:
      commonPaymentProviderFields.code.required(),

    nameAr:
      commonPaymentProviderFields.nameAr.required(),

    nameEn:
      commonPaymentProviderFields.nameEn.required(),

    descriptionAr:
      commonPaymentProviderFields.descriptionAr.default(
        "",
      ),

    descriptionEn:
      commonPaymentProviderFields.descriptionEn.default(
        "",
      ),

    environment:
      commonPaymentProviderFields.environment
        .default("TEST")
        .required(),

    baseUrl:
      commonPaymentProviderFields.baseUrl.required(),

    credentials:
      credentialsSchema.required(),

    icon:
      commonPaymentProviderFields.icon.default(
        "",
      ),

    sortOrder:
      commonPaymentProviderFields.sortOrder.default(
        0,
      ),

    isActive:
      commonPaymentProviderFields.isActive.default(
        true,
      ),
  });

/*
=====================================================
Update Schema
=====================================================

جميع الحقول اختيارية لأن PATCH قد يحدث حقلًا واحدًا.
=====================================================
*/

export const updatePaymentProviderSchema =
  Joi.object({
    ...commonPaymentProviderFields,
  }).min(1);

/*
=====================================================
Status Schema
=====================================================
*/

export const updatePaymentProviderStatusSchema =
  Joi.object({
    isActive:
      Joi.boolean().required(),
  });

/*
=====================================================
Credential Requirements
=====================================================

يفرض الحقول المطلوبة حسب كود المزود.

وضعنا هذه القواعد في Validation بدل Model لأن
Mongoose Schema عام ويخدم جميع المزودين.
=====================================================
*/

const providerCredentialRequirements =
  {
    HYPERPAY: [
      "entityId",

      "accessToken",
    ],

    MOYASAR: [
      "publishableKey",

      "secretKey",
    ],

    GEIDEA: [
      "merchantId",

      "apiKey",
    ],

    PAYTABS: [
      "profileId",

      "serverKey",
    ],

    TAP: [
      "publishableKey",

      "secretKey",
    ],

    STRIPE: [
      "secretKey",

      "webhookSecret",
    ],
  };

/*
=====================================================
Validate Provider Credentials
=====================================================
*/

const validateProviderCredentials =
  ({
    data,

    isUpdate = false,
  }) => {
    const providerCode =
      String(
        data.code || "",
      )
        .trim()
        .toUpperCase();

    /*
    في PATCH قد لا يتم إرسال code.

    عندها يتم التحقق النهائي داخل Service بعد دمج
    البيانات القديمة مع البيانات الجديدة.
    */

    if (
      !providerCode &&
      isUpdate
    ) {
      return;
    }

    const requiredFields =
      providerCredentialRequirements[
        providerCode
      ] || [];

    const credentials =
      data.credentials || {};

    const missingFields =
      requiredFields.filter(
        (field) => {
          const value =
            credentials[field];

          return (
            value === undefined ||
            value === null ||
            String(value).trim() ===
              ""
          );
        },
      );

    const invalidFields = {};

    if (
      providerCode === "HYPERPAY" &&
      missingFields.length === 0
    ) {
      const entityId = String(
        credentials.entityId || "",
      ).trim();

      const accessToken = String(
        credentials.accessToken || "",
      ).trim();

      if (entityId.length < 20) {
        invalidFields["credentials.entityId"] =
          "Entity ID غير صالح. أدخل القيمة الحقيقية من لوحة HyperPay";
      }

      if (
        accessToken.length < 20 ||
        /^Bearer\s+/i.test(accessToken)
      ) {
        invalidFields["credentials.accessToken"] =
          "Access Token غير صالح. أدخل التوكن الحقيقي دون كلمة Bearer";
      }
    }

    if (
      providerCode === "STRIPE" &&
      missingFields.length === 0
    ) {
      const secretKey = String(
        credentials.secretKey || "",
      ).trim();
      const webhookSecret = String(
        credentials.webhookSecret || "",
      ).trim();
      const environment = String(
        data.environment || "TEST",
      ).toUpperCase();

      if (!/^sk_(test|live)_/.test(secretKey)) {
        invalidFields["credentials.secretKey"] =
          "Secret Key غير صالح؛ يجب أن يبدأ بـ sk_test_ أو sk_live_";
      } else if (
        environment === "TEST" &&
        !secretKey.startsWith("sk_test_")
      ) {
        invalidFields["credentials.secretKey"] =
          "بيئة TEST تتطلب مفتاحًا يبدأ بـ sk_test_";
      } else if (
        environment === "LIVE" &&
        !secretKey.startsWith("sk_live_")
      ) {
        invalidFields["credentials.secretKey"] =
          "بيئة LIVE تتطلب مفتاحًا يبدأ بـ sk_live_";
      }

      if (!webhookSecret.startsWith("whsec_")) {
        invalidFields["credentials.webhookSecret"] =
          "Webhook Secret غير صالح؛ يجب أن يبدأ بـ whsec_";
      }
    }

    if (
      missingFields.length === 0 &&
      Object.keys(invalidFields).length === 0
    ) {
      return;
    }

    const validationError =
      new Error(
        missingFields.length
          ? `بيانات الاتصال التالية مطلوبة لمزود ${providerCode}: ${missingFields.join(", ")}`
          : `بيانات اعتماد ${providerCode} غير صالحة`,
      );

    validationError.statusCode =
      400;

    validationError.field =
      missingFields.length
        ? `credentials.${missingFields[0]}`
        : Object.keys(invalidFields)[0];

    validationError.errors = {
      ...missingFields.reduce(
        (
          result,
          field,
        ) => {
          result[
            `credentials.${field}`
          ] =
            "هذا الحقل مطلوب";

          return result;
        },
        {},
      ),
      ...invalidFields,
    };

    throw validationError;
  };

/*
=====================================================
Validation Helper
=====================================================
*/

export const validatePaymentProviderData =
  ({
    schema,

    data,

    isUpdate = false,

    validateCredentials = true,
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

    if (error) {
      const validationError =
        new Error(
          error.details
            .map(
              (item) =>
                item.message,
            )
            .join(", "),
        );

      validationError.statusCode =
        400;

      validationError.field =
        error.details?.[0]?.path?.join(
          ".",
        ) ||
        "validation";

      validationError.errors =
        error.details.reduce(
          (
            result,
            item,
          ) => {
            const field =
              item.path.join(".");

            result[field] =
              item.message;

            return result;
          },
          {},
        );

      throw validationError;
    }

    if (
      validateCredentials
    ) {
      validateProviderCredentials({
        data: value,

        isUpdate,
      });
    }

    return value;
  };

/*
=====================================================
Validate Complete Provider Data
=====================================================

تستخدم داخل Update Service بعد دمج البيانات القديمة
مع بيانات PATCH.

مثال:
-----------------------------------------------------
البيانات القديمة تحتوي code.

PATCH يحتوي accessToken فقط.

يتم دمج البيانات ثم التحقق من أن إعدادات المزود
النهائية صحيحة.
=====================================================
*/

export const validateCompletePaymentProviderCredentials =
  (
    data,
  ) => {
    validateProviderCredentials({
      data,

      isUpdate: false,
    });

    return data;
  };
