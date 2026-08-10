import Stripe from "stripe";

import AppError from "../../utils/AppError.js";

const STRIPE_CARD_METHOD_CODES = new Set([
  "CARD",
  "VISA",
  "MASTERCARD",
  "MADA",
  "APPLE_PAY",
]);

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW",
  "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF",
  "XOF", "XPF",
]);

const getStripeClient = (providerConfig = {}) => {
  if (providerConfig.stripeClient) {
    return providerConfig.stripeClient;
  }

  const secretKey = String(
    providerConfig.credentials?.secretKey || providerConfig.secretKey || "",
  ).trim();

  if (!secretKey) {
    throw new AppError(
      "مفتاح Stripe السري غير معد",
      500,
      "credentials.secretKey",
    );
  }

  return new Stripe(secretKey);
};

const toMinorAmount = (amount, currency) => {
  const numericAmount = Number(amount);
  const normalizedCurrency = String(currency || "SAR").toUpperCase();

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("مبلغ الدفع غير صحيح", 400, "amount");
  }

  const multiplier = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)
    ? 1
    : 100;

  return Math.round(numericAmount * multiplier);
};

const fromMinorAmount = (amount, currency) => {
  const normalizedCurrency = String(currency || "SAR").toUpperCase();
  const divisor = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency) ? 1 : 100;

  return Number(amount || 0) / divisor;
};

const normalizeStripeError = (error, fallback) => {
  if (error instanceof AppError) return error;

  return new AppError(
    error?.raw?.message || error?.message || fallback,
    Number(error?.statusCode) >= 500 ? 502 : 400,
    "stripe",
  );
};

const resolvePaymentIntent = (session) => {
  const paymentIntent = session?.payment_intent;

  return paymentIntent && typeof paymentIntent === "object"
    ? paymentIntent
    : null;
};

export const createStripeCheckoutSession = async ({
  amount,
  currency = "SAR",
  paymentMethodCode,
  merchantTransactionId,
  customer = {},
  draftId,
  paymentConfigurationId,
  returnUrl,
  providerConfig = {},
}) => {
  const normalizedMethod = String(paymentMethodCode || "").toUpperCase();

  if (!STRIPE_CARD_METHOD_CODES.has(normalizedMethod)) {
    throw new AppError(
      `طريقة الدفع ${normalizedMethod} غير مدعومة حاليًا عبر Stripe`,
      400,
      "paymentMethodCode",
    );
  }

  const stripe = getStripeClient(providerConfig);
  const normalizedCurrency = String(currency || "SAR").toLowerCase();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: normalizedCurrency,
            unit_amount: toMinorAmount(amount, currency),
            product_data: {
              name: `Booking payment ${merchantTransactionId}`,
            },
          },
        },
      ],
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          paymentReference: String(merchantTransactionId || ""),
          draftId: String(draftId || ""),
          paymentConfigurationId: String(paymentConfigurationId || ""),
          paymentMethodCode: normalizedMethod,
        },
      },
      metadata: {
        paymentReference: String(merchantTransactionId || ""),
        draftId: String(draftId || ""),
        paymentConfigurationId: String(paymentConfigurationId || ""),
        paymentMethodCode: normalizedMethod,
      },
      customer_email: customer.email || undefined,
      success_url: returnUrl,
      cancel_url: returnUrl,
    });

    return {
      id: session.id,
      checkoutId: session.id,
      providerReference: session.id,
      redirectUrl: session.url || "",
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : null,
      result: {
        code: "CHECKOUT_SESSION_CREATED",
        description: "Stripe Checkout Session created",
      },
    };
  } catch (error) {
    throw normalizeStripeError(error, "تعذر إنشاء جلسة Stripe");
  }
};

export const verifyStripePayment = async ({
  checkoutId,
  providerConfig = {},
}) => {
  if (!checkoutId) {
    throw new AppError("معرف جلسة Stripe مطلوب", 400, "checkoutId");
  }

  const stripe = getStripeClient(providerConfig);

  try {
    const session = await stripe.checkout.sessions.retrieve(checkoutId, {
      expand: ["payment_intent"],
    });

    const paymentIntent = resolvePaymentIntent(session);
    const intentStatus = paymentIntent?.status || "";

    let verificationStatus = "PENDING";
    let paymentType = "";

    if (intentStatus === "requires_capture") {
      verificationStatus = "SUCCESS";
      paymentType = "PA";
    } else if (intentStatus === "succeeded") {
      verificationStatus = "SUCCESS";
      paymentType = "CP";
    } else if (["canceled", "requires_payment_method"].includes(intentStatus)) {
      verificationStatus = "FAILED";
    }

    const currency = String(
      paymentIntent?.currency || session.currency || "",
    ).toUpperCase();
    const minorAmount =
      paymentIntent?.amount ?? session.amount_total ?? 0;

    return {
      verificationStatus,
      resultCode: intentStatus || session.status || "",
      resultDescription:
        paymentIntent?.last_payment_error?.message || intentStatus || session.status || "",
      providerReference: paymentIntent?.id || session.id,
      merchantTransactionId:
        paymentIntent?.metadata?.paymentReference ||
        session.metadata?.paymentReference ||
        "",
      paymentType,
      amount: fromMinorAmount(minorAmount, currency),
      currency,
      paymentBrand: paymentIntent?.payment_method_types?.[0] || "card",
    };
  } catch (error) {
    throw normalizeStripeError(error, "تعذر التحقق من دفعة Stripe");
  }
};

export const captureStripePayment = async ({
  referencedPaymentId,
  amount,
  currency,
  providerConfig = {},
}) => {
  const stripe = getStripeClient(providerConfig);

  try {
    const current = await stripe.paymentIntents.retrieve(referencedPaymentId);
    const paymentIntent = current.status === "requires_capture"
      ? await stripe.paymentIntents.capture(referencedPaymentId, {
          amount_to_capture: toMinorAmount(amount, currency),
        })
      : current;

    if (paymentIntent.status !== "succeeded") {
      throw new AppError(
        `لا يمكن تحصيل PaymentIntent في الحالة ${paymentIntent.status}`,
        409,
        "providerOperation",
      );
    }

    return {
      operationStatus: "SUCCESS",
      resultCode: paymentIntent.status,
      resultDescription: "Stripe payment captured",
      providerReference: paymentIntent.id,
    };
  } catch (error) {
    throw normalizeStripeError(error, "تعذر تحصيل دفعة Stripe");
  }
};

export const refundStripePayment = async ({
  referencedPaymentId,
  amount,
  currency,
  providerConfig = {},
}) => {
  const stripe = getStripeClient(providerConfig);

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      referencedPaymentId,
    );

    if (paymentIntent.status !== "succeeded") {
      throw new AppError(
        `لا يمكن استرجاع PaymentIntent في الحالة ${paymentIntent.status}`,
        409,
        "providerOperation",
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: referencedPaymentId,
      amount: toMinorAmount(amount, currency),
    });

    if (!["succeeded", "pending"].includes(refund.status)) {
      throw new AppError(
        `فشل استرجاع Stripe بالحالة ${refund.status}`,
        409,
        "providerOperation",
      );
    }

    return {
      operationStatus: refund.status === "succeeded" ? "SUCCESS" : "PENDING",
      resultCode: refund.status,
      resultDescription: "Stripe refund created",
      providerReference: referencedPaymentId,
      operationReference: refund.id,
    };
  } catch (error) {
    throw normalizeStripeError(error, "تعذر استرجاع دفعة Stripe");
  }
};

export const cancelStripePayment = async ({
  referencedPaymentId,
  providerConfig = {},
}) => {
  const stripe = getStripeClient(providerConfig);

  try {
    let paymentIntentId = referencedPaymentId;

    if (String(referencedPaymentId || "").startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(
        referencedPaymentId,
      );

      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "";

      if (!paymentIntentId) {
        const expiredSession = session.status === "open"
          ? await stripe.checkout.sessions.expire(referencedPaymentId)
          : session;

        return {
          operationStatus: "SUCCESS",
          resultCode: expiredSession.status,
          resultDescription: "Stripe Checkout Session expired",
          providerReference: expiredSession.id,
        };
      }
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
    );

    if (paymentIntent.status === "succeeded") {
      throw new AppError(
        "تم تحصيل دفعة Stripe؛ استخدم الاسترجاع بدل الإلغاء",
        409,
        "providerOperation",
      );
    }

    if (paymentIntent.status === "canceled") {
      return {
        operationStatus: "SUCCESS",
        resultCode: paymentIntent.status,
        resultDescription: "Stripe PaymentIntent already canceled",
        providerReference: paymentIntent.id,
      };
    }

    const canceled = await stripe.paymentIntents.cancel(paymentIntentId);

    return {
      operationStatus: "SUCCESS",
      resultCode: canceled.status,
      resultDescription: "Stripe PaymentIntent canceled",
      providerReference: canceled.id,
    };
  } catch (error) {
    throw normalizeStripeError(error, "تعذر إلغاء دفعة Stripe");
  }
};

export const constructStripeWebhookEvent = ({
  rawBody,
  signature,
  webhookSecret,
  providerConfig = {},
}) => {
  const secret = String(
    webhookSecret || providerConfig.credentials?.webhookSecret || "",
  ).trim();

  if (!secret) {
    throw new AppError("Webhook Secret الخاص بـStripe غير معد", 500, "webhookSecret");
  }

  if (!signature) {
    throw new AppError("توقيع Stripe مفقود", 400, "stripe-signature");
  }

  try {
    return getStripeClient(providerConfig).webhooks.constructEvent(
      rawBody,
      signature,
      secret,
    );
  } catch {
    throw new AppError("توقيع Stripe غير صالح", 400, "stripe-signature");
  }
};
