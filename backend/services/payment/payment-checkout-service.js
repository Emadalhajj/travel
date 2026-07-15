import AppError from "../../utils/AppError.js";
import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import { buildBookingPricingFromDraft } from "../draft-bookings/draft-booking-service.js";
import { createHyperPayCheckout } from "./hyperpay-service.js";

export const createPaymentCheckoutSessionService = async ({
  draftId,
  paymentMethod,
  gateway,
  req,
}) => {
  const draft = await DraftBooking.findById(draftId);

  if (!draft) {
    throw new AppError("مسودة الحجز غير موجودة", 404, "draftBooking");
  }

  if (draft.status !== "draft") {
    throw new AppError("لا يمكن الدفع لمسودة غير نشطة", 400, "draftBooking");
  }

  const pricing = buildBookingPricingFromDraft(draft);

  const amount = pricing.totalPrice || pricing.totalAmount || pricing.total;

  if (!amount || Number(amount) <= 0) {
    throw new AppError("مبلغ الدفع غير صحيح", 400, "payment");
  }

  const paymentReference = `PAY-${Date.now()}-${draft._id}`;

  /*
    هنا لاحقًا يتم ربط HyperPay / PayTabs / Stripe فعليًا.

    حاليًا نرجع redirectUrl وهمي داخلي حتى يكتمل التدفق.
    بعد الربط الحقيقي، redirectUrl يأتي من بوابة الدفع.
  */

  if (gateway === "hyperpay") {
    const checkout = await createHyperPayCheckout({
      amount,
      currency: pricing.currency || "SAR",
      merchantTransactionId: paymentReference,
      customer: draft.customer || {},
      draftId: draft._id,
    });

    return {
      draftId: draft._id,
      amount,
      currency: pricing.currency || "SAR",
      paymentMethod,
      gateway,
      paymentReference,
      checkoutId: checkout.id,
      checkout,
    };
  }

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000")
    .replace(/\/$/, "");

  const redirectUrl =
    paymentMethod === "card"
      ? `${frontendUrl}/booking/payment/redirect/${draft._id}?reference=${paymentReference}`
      : null;

  return {
    draftId: draft._id,
    amount,
    currency: pricing.currency || "SAR",
    paymentMethod,
    gateway,
    paymentReference,
    redirectUrl,
  };
};
