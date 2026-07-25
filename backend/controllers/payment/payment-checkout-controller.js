import asyncHandler from "express-async-handler";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";
import { createPaymentCheckoutSessionService } from "../../services/payment/payment-checkout-service.js";

export const createPaymentCheckoutSession = asyncHandler(
  async (req, res) => {
    const {
      draftId,
      paymentMethod = "CARD",
      gateway = "HYPERPAY",
    } = req.body || {};

    const checkout =
      await createPaymentCheckoutSessionService({
        draftId,
        paymentMethod,
        gateway,
        req,
      });

    /*
    ملاحظة:
    هذا الجزء سيعمل بعد تعديل PaymentTransaction Model
    وإضافة draftBooking وcheckoutId وmethodCode.
    */

    await PaymentTransaction.create({
      draftBooking: checkout.draftId,

      booking: null,

      user: checkout.userId,

      amount: checkout.amount,

      currency: checkout.currency,

      methodCode: checkout.paymentMethod,

      status: "pending",

      providerCode: checkout.providerCode,

      gatewayReference:
        checkout.paymentReference,

      checkoutId: checkout.checkoutId,

      notes:
        "Payment checkout session created",

      createdBy:
        req.user?._id ||
        checkout.userId ||
        null,
    });

    res.status(201).json({
      success: true,

      message:
        "Payment checkout session created successfully",

      data: {
        checkoutId: checkout.checkoutId,

        paymentReference:
          checkout.paymentReference,

        amount: checkout.amount,

        currency: checkout.currency,

        paymentMethod:
          checkout.paymentMethod,

        providerCode:
          checkout.providerCode,
      },
    });
  },
);
