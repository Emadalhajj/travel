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
import { protect } from "../../middleware/authMiddleware.js";
import {
  paymentInitializeRateLimiter,
  paymentStatusRateLimiter,
  uploadRateLimiter,
} from "../../middleware/security/rate-limiters.js";

const router =
  express.Router();

router.get(
  "/:transactionId/status",
  protect,
  paymentStatusRateLimiter,
  getPublicPaymentStatus,
);

router.post(
  "/bank-transfer/:transactionId/proof",
  protect,
  uploadRateLimiter,
  uploadPaymentProof.array(
    "proofAttachments",
    3,
  ),

  submitBankTransferProof,
);

router.post(
  "/initialize",
  protect,
  paymentInitializeRateLimiter,
  initializePublicPayment,
);

export default router;
