import express from "express";

import { getPublicPaymentConfigurations } from "../../controllers/payment/public-payment-configuration-controller.js";

const router = express.Router();

/*
=============================================================================
Public Payment Configurations
=============================================================================

GET /api/public/payments/configurations
=============================================================================
*/

router.get("/configurations", getPublicPaymentConfigurations);

export default router;
