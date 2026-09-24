import express from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  downloadDraftDocument,
  downloadPaymentProof,
  downloadLegacyPrivateFile,
  downloadBookingActionDocument,
  downloadServiceDocument,
  downloadLegacyVoucher,
  downloadHotelAttachment,
} from "../controllers/private-file-controller.js";

const router = express.Router();

router.get(
  "/private-files/hotels/:hotelId/:attachmentId",
  protect,
  authorize("admin", "superAdmin"),
  downloadHotelAttachment,
);

router.get(
  "/private-files/legacy/:folder/:filename",
  protect,
  downloadLegacyPrivateFile,
);
router.get(
  "/private-files/service-documents/:bookingId/:documentId",
  protect,
  downloadServiceDocument,
);
router.get(
  "/private-files/vouchers/:voucherId",
  protect,
  downloadLegacyVoucher,
);
router.get(
  "/private-files/booking-actions/:bookingId/:filename",
  protect,
  downloadBookingActionDocument,
);

router.get("/private-files/drafts/:draftId/:filename", protect, downloadDraftDocument);
router.get(
  "/private-files/payment-proofs/:transactionId/:filename",
  protect,
  downloadPaymentProof,
);

export default router;
