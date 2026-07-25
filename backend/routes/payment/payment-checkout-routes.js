import express from "express";

import { createPaymentCheckoutSession } from "../../controllers/payment/payment-checkout-controller.js";
import { protect } from "../../middleware/authMiddleware.js";
const router = express.Router();

router.post(
    "/checkout-session",
     protect,
     createPaymentCheckoutSession);

export default router;
