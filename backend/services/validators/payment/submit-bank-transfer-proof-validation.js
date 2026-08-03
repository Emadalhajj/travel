/*
Validation لإرسال إثبات التحويل
*/

import Joi from "joi";

const objectIdSchema = Joi.string()
  .trim()
  .hex()
  .length(24);

export const submitBankTransferProofSchema =
  Joi.object({
    transactionId: objectIdSchema
      .required()
      .messages({
        "any.required":
          "معرف عملية الدفع مطلوب",
      }),

    transferReference: Joi.string()
      .trim()
      .allow("")
      .max(200),
  });

export const validateSubmitBankTransferProof = (
  payload,
) => {
  const {
    value,
    error,
  } =
    submitBankTransferProofSchema.validate(
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

  validationError.statusCode = 400;

  validationError.errors =
    error.details.reduce(
      (result, item) => {
        result[
          item.path.join(".")
        ] =
          item.message;

        return result;
      },
      {},
    );

  throw validationError;
};