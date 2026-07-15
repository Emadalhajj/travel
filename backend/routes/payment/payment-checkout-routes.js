import express from "express";
// import { protect } from "../../middleware/authMiddleware.js";

import { createPaymentCheckoutSession } from "../../controllers/payment/payment-checkout-controller.js";

const router = express.Router();

router.post("/checkout-session", createPaymentCheckoutSession);

export default router;
