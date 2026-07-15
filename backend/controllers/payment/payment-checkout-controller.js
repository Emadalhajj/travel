import asyncHandler from "express-async-handler";
import AppError from "../../utils/AppError.js";

import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import PaymentTransaction from "../../models/paymentTransaction-model.js";

import { buildBookingPricingFromDraft } from "../../services/draft-bookings/draft-booking-service.js";
import { createHyperPayCheckout } from "../../services/payment/hyperpay-service.js";

export const createPaymentCheckoutSession = asyncHandler(async (req, res) => {
  const { draftId, paymentMethod = "card" } = req.body || {};

  if (!draftId) {
    throw new AppError("draftId is required", 400, "draftId");
  }

  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new AppError("Draft booking not found", 404, "draftBooking");
  }

  if (draft.status !== "draft") {
    throw new AppError("Only draft bookings can be paid", 400, "draftBooking");
  }

  const pricing = buildBookingPricingFromDraft(draft);
  const amount = Number(pricing.totalPrice || pricing.totalAmount || pricing.total || 0);

  if (!amount || amount <= 0) {
    throw new AppError("Invalid payment amount", 400, "payment");
  }

  const paymentReference = `HP-${Date.now()}-${draft._id}`;

  const checkout = await createHyperPayCheckout({
    amount,
    currency: pricing.currency || "SAR",
    merchantTransactionId: paymentReference,
    customer: draft.customer,
    draftId: draft._id,
  });

  await PaymentTransaction.create({
    booking: null,
    draftBooking: draft._id,
    user: draft.user || req.user?._id || null,
    amount,
    currency: pricing.currency || "SAR",
    method: paymentMethod,
    status: "pending",
    gateway: "hyperpay",
    gatewayReference: paymentReference,
    checkoutId: checkout.id,
    notes: "HyperPay checkout session created",
    createdBy: req.user?._id || draft.user || null,
  });

  res.status(201).json({
    success: true,
    message: "HyperPay checkout session created successfully",
    data: {
      checkoutId: checkout.id,
      paymentReference,
      amount,
      currency: pricing.currency || "SAR",
      gateway: "hyperpay",
    },
  });
});