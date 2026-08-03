import Joi from "joi";

import {
  PAYMENT_SECTION_CODE_VALUES,
} from "../../../constants/payments/payment-section-codes.js";

import {
  PAYMENT_CONFIGURATION_TYPE_VALUES,
} from "../../../constants/payments/payment-configuration-types.js";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../../constants/payments/payment-method-codes.js";

const objectIdSchema = Joi.string()
  .trim()
  .hex()
  .length(24);

const optionalText = Joi.string()
  .trim()
  .allow("")
  .max(2000);

const configurationFields = {
  sectionCode: Joi.string()
    .trim()
    .uppercase()
    .valid(...PAYMENT_SECTION_CODE_VALUES),
  paymentMethodCode: Joi.string()
    .trim()
    .uppercase()
    .valid(...PAYMENT_METHOD_CODE_VALUES),
  configurationType: Joi.string()
    .trim()
    .uppercase()
    .valid(...PAYMENT_CONFIGURATION_TYPE_VALUES),
  providerId:
    objectIdSchema.allow(null, ""),
  bankAccountIds: Joi.array()
    .items(objectIdSchema)
    .unique(),
  supportedCurrencies: Joi.array()
    .items(
      Joi.string()
        .trim()
        .uppercase()
        .length(3),
    )
    .unique(),
  displayNameAr: optionalText,
  displayNameEn: optionalText,
  instructionsAr: optionalText,
  instructionsEn: optionalText,
  requiresAttachment: Joi.boolean(),
  requiresReference: Joi.boolean(),
  minimumAmount:
    Joi.number().min(0).allow(null),
  maximumAmount:
    Joi.number().min(0).allow(null),
  availableFrom:
    Joi.date().iso().allow(null),
  availableUntil:
    Joi.date().iso().allow(null),
  sortOrder:
    Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

const validateRelations =
  (value, helpers) => {
    if (
      value.minimumAmount != null &&
      value.maximumAmount != null &&
      value.minimumAmount >
        value.maximumAmount
    ) {
      return helpers.error(
        "configuration.amountRange",
      );
    }

    if (
      value.availableFrom &&
      value.availableUntil &&
      new Date(value.availableFrom) >
        new Date(value.availableUntil)
    ) {
      return helpers.error(
        "configuration.dateRange",
      );
    }

    return value;
  };

const relationMessages = {
  "configuration.amountRange":
    "الحد الأدنى للمبلغ لا يمكن أن يتجاوز الحد الأعلى",
  "configuration.dateRange":
    "تاريخ بداية الإتاحة لا يمكن أن يأتي بعد تاريخ النهاية",
};

export const createPaymentConfigurationSchema =
  Joi.object({
    ...configurationFields,
    sectionCode:
      configurationFields.sectionCode.required(),
    paymentMethodCode:
      configurationFields.paymentMethodCode.required(),
    configurationType:
      configurationFields.configurationType.optional(),
    providerId:
      configurationFields.providerId.default(null),
    bankAccountIds:
      configurationFields.bankAccountIds.default([]),
    supportedCurrencies:
      configurationFields.supportedCurrencies.default([]),
    displayNameAr:
      configurationFields.displayNameAr.default(""),
    displayNameEn:
      configurationFields.displayNameEn.default(""),
    instructionsAr:
      configurationFields.instructionsAr.default(""),
    instructionsEn:
      configurationFields.instructionsEn.default(""),
    requiresAttachment:
      configurationFields.requiresAttachment.default(false),
    requiresReference:
      configurationFields.requiresReference.default(false),
    minimumAmount:
      configurationFields.minimumAmount.default(null),
    maximumAmount:
      configurationFields.maximumAmount.default(null),
    availableFrom:
      configurationFields.availableFrom.default(null),
    availableUntil:
      configurationFields.availableUntil.default(null),
    sortOrder:
      configurationFields.sortOrder.default(0),
    isActive:
      configurationFields.isActive.default(true),
  })
    .custom(validateRelations)
    .messages(relationMessages);

export const updatePaymentConfigurationSchema =
  Joi.object(configurationFields)
    .min(1)
    .custom(validateRelations)
    .messages(relationMessages);

export const updatePaymentConfigurationStatusSchema =
  Joi.object({
    isActive:
      Joi.boolean().required(),
  });

export const validatePaymentConfigurationData =
  ({
    schema,
    data,
  }) => {
    const {
      value,
      error,
    } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (!error) {
      return value;
    }

    const validationError =
      new Error(
        error.details
          .map((item) => item.message)
          .join(", "),
      );

    validationError.statusCode = 400;
    validationError.field =
      error.details[0]?.path?.join(".") ||
      "validation";
    validationError.errors =
      error.details.reduce(
        (result, item) => {
          result[
            item.path.join(".") ||
              "validation"
          ] = item.message;
          return result;
        },
        {},
      );

    throw validationError;
  };

export const validateCompletePaymentConfiguration =
  (data) =>
    validatePaymentConfigurationData({
      schema:
        createPaymentConfigurationSchema,
      data,
    });
