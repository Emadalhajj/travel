import asyncHandler from "express-async-handler";
import { initializePublicPaymentService } from "../../services/payment/initialize-public-payment-service.js";

export const createPaymentCheckoutSession = asyncHandler(
  async (req, res) => {
    const {
      draftId,
      configurationId,
      sectionCode,
      paymentMethodCode,
      selectedBankAccountId,
    } = req.body || {};

    const result =
      await initializePublicPaymentService({
        draftId,
        configurationId,
        sectionCode,
        paymentMethodCode,
        selectedBankAccountId,
        userId:
          req.user?._id ||
          req.user?.id ||
          null,
        req,
    });

    res.status(201).json({
      success: true,

      message:
        "Payment checkout session created successfully",

      data: {
        ...result,
      },
    });
  },
);
