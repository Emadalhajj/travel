import express from "express";
import { handlePaymentCallback } from "../../controllers/payment/payment-callback-controller.js";

const router = express.Router();

/*
لا تضع protect هنا.
بوابة الدفع الخارجية لن تملك JWT.
الحماية تكون بتوقيع Signature من بوابة الدفع.
*/

router.post("/callback", handlePaymentCallback);
router.post("/webhook", handlePaymentCallback);

export default router;