import AppError from "../../utils/AppError.js";

import PaymentProvider from "../../models/payments/payment-provider-model.js";

import {
  completeProviderPaymentService,
} from "../../services/payment/complete-provider-payment-service.js";

import {
  findPaymentTransactionService,
} from "../../services/payment/paymentTransaction-service.js";

import {
  constructStripeWebhookEvent,
} from "../../services/payment/stripe-service.js";

const HANDLED_STRIPE_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "payment_intent.amount_capturable_updated",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
]);

const resolvePaymentReference = (payload) => {
  const object = payload?.data?.object || {};

  return String(
    object.metadata?.paymentReference ||
      object.payment_intent?.metadata?.paymentReference ||
      "",
  ).trim();
};

export const handleStripeWebhook = async (req, res, next) => {
  try {
    const provider = await PaymentProvider.findOne({
      code: "STRIPE",
      isActive: true,
      isDeleted: { $ne: true },
    }).select(
      "+credentials.secretKey +credentials.webhookSecret code environment baseUrl",
    );

    if (!provider) {
      throw new AppError("مزود Stripe غير متاح", 503, "providerId");
    }

    const event = constructStripeWebhookEvent({
      rawBody: req.body,
      signature: req.headers["stripe-signature"],
      providerConfig: {
        environment: provider.environment,
        baseUrl: provider.baseUrl,
        credentials: provider.credentials || {},
      },
    });

    if (!HANDLED_STRIPE_EVENTS.has(event.type)) {
      return res.status(200).json({ received: true });
    }

    const paymentReference = resolvePaymentReference(event);

    if (!paymentReference) {
      throw new AppError(
        "Stripe Webhook لا يحتوي مرجع المعاملة",
        400,
        "paymentReference",
      );
    }

    const transaction = await findPaymentTransactionService({
      paymentReference,
    });

    if (
      String(transaction.providerCode || "").toUpperCase() !== "STRIPE" ||
      String(transaction.paymentProvider || "") !== String(provider._id)
    ) {
      throw new AppError("المعاملة لا تخص مزود Stripe المحدد", 400, "providerCode");
    }

    await completeProviderPaymentService({
      transactionId: transaction._id,
      req,
    });

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    return next(error);
  }
};
