/*
=====================================================
Payment Callback Routes
=====================================================

لا تستخدم protect هنا؛ لأن مزود الدفع الخارجي
لا يملك JWT.

الحماية الفعلية تكون عبر:
-----------------------------------------------------
- التحقق Server-to-Server من نتيجة الدفع.
- Webhook Signature عند توفيره من المزود.
=====================================================
*/

import express from "express";

import {
  handlePaymentCallback,
} from "../../controllers/payment/payment-callback-controller.js";

const router = express.Router();

router.get(
  "/callback",
  handlePaymentCallback,
);

router.post(
  "/callback",
  handlePaymentCallback,
);

router.post(
  "/webhook",
  handlePaymentCallback,
);

export default router;
