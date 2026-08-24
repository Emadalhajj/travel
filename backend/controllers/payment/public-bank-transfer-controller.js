import { validateSubmitBankTransferProof } from "../../services/validators/payment/submit-bank-transfer-proof-validation.js";

import { submitBankTransferProofService } from "../../services/payment/submit-bank-transfer-proof-service.js";

export const submitBankTransferProof = async (req, res, next) => {
  try {
    const validatedData = validateSubmitBankTransferProof({
      transactionId: req.params.transactionId,

      transferReference: req.body.transferReference,
    });

    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : req.file
        ? [req.file]
        : [];

    const result = await submitBankTransferProofService({
      ...validatedData,

      uploadedFiles,

      userId: req.user?._id || req.user?.id || null,
      req,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
