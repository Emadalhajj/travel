/*
=====================================================
Payment Callback Controller
=====================================================

Controller خفيف لاستقبال Callback أو Webhook.
لا يتعامل مباشرة مع MongoDB ولا يثق في status
القادم من الطلب.
=====================================================
*/

import asyncHandler from "express-async-handler";

import {
  completeProviderPaymentService,
} from "../../services/payment/complete-provider-payment-service.js";

export const handlePaymentCallback = asyncHandler(
  async (req, res) => {
    const payload = {
      ...(req.query || {}),
      ...(req.body || {}),
    };

    const result =
      await completeProviderPaymentService({
        transactionId:
          payload.transactionId,
        paymentReference:
          payload.paymentReference ||
          payload.merchantTransactionId ||
          payload.reference,
        providerReference:
          payload.providerReference,
        checkoutId:
          payload.checkoutId,
        resourcePath:
          payload.resourcePath ||
          payload.resource_path ||
          "",
        req,
      });

    res.status(200).json({
      success: true,
      message:
        result.verificationStatus === "SUCCESS"
          ? "Payment processed successfully"
          : result.verificationStatus === "PENDING"
            ? "Payment is still pending"
            : "Payment verification failed",
      data: result,
    });
  },
);
