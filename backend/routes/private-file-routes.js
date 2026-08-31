import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
  downloadDraftDocument,
  downloadPaymentProof,
  downloadLegacyPrivateFile,
} from "../controllers/private-file-controller.js";

const router = express.Router();

router.get(
  "/private-files/legacy/:folder/:filename",
  protect,
  downloadLegacyPrivateFile,
);

router.get("/private-files/drafts/:draftId/:filename", protect, downloadDraftDocument);
router.get(
  "/private-files/payment-proofs/:transactionId/:filename",
  protect,
  downloadPaymentProof,
);

export default router;
