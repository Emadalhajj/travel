import Joi from "joi";

import {
  PAYMENT_SECTION_CODE_VALUES,
} from "../../../constants/payments/payment-section-codes.js";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../../constants/payments/payment-method-codes.js";

const objectIdSchema =
  Joi.string()
    .trim()
    .hex()
    .length(24);

export const initializePublicPaymentSchema =
  Joi.object({
    draftId:
      objectIdSchema
        .required()
        .messages({
          "any.required":
            "معرف الحجز مطلوب",
        }),

    configurationId:
      objectIdSchema
        .required()
        .messages({
          "any.required":
            "إعداد الدفع مطلوب",
        }),

    sectionCode:
      Joi.string()
        .trim()
        .uppercase()
        .valid(
          ...PAYMENT_SECTION_CODE_VALUES,
        )
        .required(),

    paymentMethodCode:
      Joi.string()
        .trim()
        .uppercase()
        .valid(
          ...PAYMENT_METHOD_CODE_VALUES,
        )
        .required(),

    selectedBankAccountId:
      objectIdSchema
        .allow(
          null,
          "",
        )
        .optional(),
  });

export const validateInitializePublicPayment =
  (payload) => {
    const {
      value,
      error,
    } =
      initializePublicPaymentSchema.validate(
        payload,
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
          .join("، "),
      );

    validationError.statusCode =
      400;

    validationError.errors =
      error.details.reduce(
        (
          errors,
          item,
        ) => {
          errors[
            item.path.join(".")
          ] =
            item.message;

          return errors;
        },
        {},
      );

    throw validationError;
  };
