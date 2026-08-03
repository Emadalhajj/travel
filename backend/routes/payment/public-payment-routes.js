import express from "express";
import {
  submitBankTransferProof,
} from "../../controllers/payment/public-bank-transfer-controller.js";

import {
  uploadPaymentProof,
} from "../../middleware/upload/index.js";

import {
  initializePublicPayment,
} from "../../controllers/payment/public-payment-initialization-controller.js";
import {
  getPublicPaymentStatus,
} from "../../controllers/payment/public-payment-status-controller.js";

const router =
  express.Router();

router.get(
  "/:transactionId/status",
  getPublicPaymentStatus,
);

router.post(
  "/bank-transfer/:transactionId/proof",

  uploadPaymentProof.array(
    "proofAttachments",
    3,
  ),

  submitBankTransferProof,
);

router.post(
  "/initialize",
  initializePublicPayment,
);

export default router;
