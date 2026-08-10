/*
=====================================================
Payment Checkout Service
=====================================================

تنشئ جلسة الدفع الإلكترونية وتنسق بين:
- DraftBooking.
- PaymentConfiguration.
- PaymentProvider.
- PaymentTransaction Layer.
- Payment Provider Factory.

مهم:
-----------------------------------------------------
لا يتعامل Factory مع MongoDB.
ولا يتم حفظ Raw Gateway Payload داخل المعاملة.
=====================================================
*/

import AppError from "../../utils/AppError.js";

import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import PaymentProvider from "../../models/payments/payment-provider-model.js";

import { buildBookingPricingFromDraft } from "../draft-bookings/draft-booking-service.js";
import { createProviderCheckout } from "./providers/payment-provider-factory.js";

import {
  attachProviderCheckoutService,
  createPaymentTransactionService,
  findPaymentTransactionService,
  markPaymentTransactionFailedService,
  updatePaymentTransactionStatusService,
} from "./paymentTransaction-service.js";

import {
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

import {
  PAYMENT_TRANSACTION_EVENT_CODES,
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";

const PAYMENT_PROVIDER_CREDENTIAL_SELECT = [
  "+credentials.entityId",
  "+credentials.accessToken",
  "+credentials.webhookSecret",
  "+credentials.publishableKey",
  "+credentials.secretKey",
  "+credentials.apiKey",
  "+credentials.merchantId",
  "+credentials.terminalId",
  "+credentials.profileId",
  "+credentials.serverKey",
  "+credentials.clientKey",
].join(" ");

const createPaymentReference = (draftId) =>
  `PAY-${Date.now()}-${draftId}`;

const buildProviderConfig = (provider) => ({
  environment: provider.environment,
  baseUrl: provider.baseUrl,
  credentials: provider.credentials || {},
});

const extractCheckoutResult = (checkout = {}) => ({
  checkoutId: checkout.id || checkout.checkoutId || "",
  providerReference:
    checkout.providerReference ||
    checkout.transactionId ||
    checkout.reference ||
    "",
  redirectUrl:
    checkout.redirectUrl || checkout.redirect?.url || "",
  clientSecret: checkout.clientSecret || "",
  expiresAt: checkout.expiresAt || null,
});

const getExistingCheckoutResult = async (transaction) => {
  if (!transaction?.checkoutId) return null;

  const storedTransaction = await findPaymentTransactionService({
    transactionId: transaction._id,
    includeRedirectUrl: true,
  });

  return {
    checkoutId: storedTransaction.checkoutId || "",
    redirectUrl: storedTransaction.redirectUrl || "",
  };
};

const buildCheckoutResponse = ({
  transaction,
  provider,
  paymentMethodCode,
  checkoutResult,
}) => {
  const providerCode = String(provider.code || "").toUpperCase();

  if (providerCode === "STRIPE") {
    const publishableKey = String(
      provider.credentials?.publishableKey || "",
    ).trim();

    if (!publishableKey) {
      throw new AppError(
        "المفتاح العام لـStripe غير معد",
        500,
        "credentials.publishableKey",
      );
    }

    if (!checkoutResult.clientSecret) {
      throw new AppError(
        "لم يتم استلام مفتاح جلسة Stripe المضمنة",
        502,
        "stripe.clientSecret",
      );
    }

    return {
      action: "EMBEDDED_CHECKOUT",
      paymentTransactionId: transaction._id,
      status: String(transaction.status).toUpperCase(),
      provider: {
        code: provider.code,
        environment: provider.environment,
      },
      paymentMethodCode,
      checkoutId: checkoutResult.checkoutId,
      clientSecret: checkoutResult.clientSecret,
      publishableKey,
    };
  }

  return {
    action: "REDIRECT",
    paymentTransactionId: transaction._id,
    status: String(transaction.status).toUpperCase(),
    provider: {
      code: provider.code,
      environment: provider.environment,
    },
    paymentMethodCode,
    checkoutId: checkoutResult.checkoutId,
    redirectUrl: checkoutResult.redirectUrl,
  };
};

export const createPaymentCheckoutSessionService = async ({
  draftId,
  paymentConfiguration,
  customer,
  returnUrl,
  req,
}) => {
  if (!paymentConfiguration) {
    throw new AppError(
      "إعداد الدفع غير موجود",
      400,
      "paymentConfiguration",
    );
  }

  if (paymentConfiguration.configurationType !== "PROVIDER") {
    throw new AppError(
      "إعداد الدفع المحدد ليس دفعًا إلكترونيًا",
      400,
      "paymentConfiguration",
    );
  }

  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new AppError(
      "مسودة الحجز غير موجودة",
      404,
      "draftBooking",
    );
  }

  if (draft.status !== "draft") {
    throw new AppError(
      "لا يمكن الدفع لمسودة غير نشطة",
      400,
      "draftBooking",
    );
  }

  const pricing = await buildBookingPricingFromDraft(draft);
  const amount = Number(
    pricing.totalPrice || pricing.totalAmount || pricing.total || 0,
  );
  const currency = pricing.currency || draft.currency || "SAR";

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("مبلغ الدفع غير صحيح", 400, "payment");
  }

  const paymentMethodCode = String(
    paymentConfiguration.paymentMethodCode || "",
  )
    .trim()
    .toUpperCase();

  if (!paymentMethodCode) {
    throw new AppError(
      "طريقة الدفع غير محددة",
      400,
      "paymentMethodCode",
    );
  }

  const providerReference = paymentConfiguration.providerId;
  const providerId = providerReference?._id || providerReference;

  if (!providerId) {
    throw new AppError("مزود الدفع غير محدد", 400, "providerId");
  }

  const provider = await PaymentProvider.findOne({
    _id: providerId,
    isActive: true,
    isDeleted: { $ne: true },
  }).select(PAYMENT_PROVIDER_CREDENTIAL_SELECT);

  if (!provider) {
    throw new AppError("مزود الدفع غير متاح", 400, "providerId");
  }

  const supportedMethods = Array.isArray(provider.supportedPaymentMethods)
    ? provider.supportedPaymentMethods
    : [];

  if (!supportedMethods.includes(paymentMethodCode)) {
    throw new AppError(
      "مزود الدفع لا يدعم طريقة الدفع المحددة",
      400,
      "paymentMethodCode",
    );
  }

  const actorId = req?.user?._id || draft.user || null;
  const paymentReference = createPaymentReference(draft._id);

  const transaction = await createPaymentTransactionService({
    draftBooking: draft._id,
    user: draft.user || actorId,
    paymentConfigurationId: paymentConfiguration._id,
    paymentMethodCode,
    providerId: provider._id,
    providerCode: provider.code,
    providerEnvironment: provider.environment,
    amount,
    currency,
    status: PAYMENT_TRANSACTION_STATUSES.INITIATED,
    paymentReference,
    createdBy: actorId,
    req,
    reuseExisting: true,
    eventSource: PAYMENT_TRANSACTION_EVENT_SOURCES.PUBLIC_API,
  });

  const existingCheckout = await getExistingCheckoutResult(transaction);
  const providerCode = String(provider.code || "").toUpperCase();

  if (existingCheckout && providerCode !== "STRIPE") {
    return {
      action: "REDIRECT",
      paymentTransactionId: transaction._id,
      status: String(transaction.status).toUpperCase(),
      provider: {
        code: provider.code,
        environment: provider.environment,
      },
      paymentMethodCode,
      ...existingCheckout,
    };
  }

  const normalizedReturnUrl = String(
    returnUrl ||
      `${String(
        process.env.FRONTEND_URL || "http://localhost:3000",
      ).replace(/\/$/, "")}/booking/payment/${draft._id}/result`,
  ).trim();

  const separator = normalizedReturnUrl.includes("?") ? "&" : "?";
  const providerReturnUrl =
    `${normalizedReturnUrl}${separator}` +
    `transactionId=${encodeURIComponent(transaction._id)}`;

  try {
    const checkout = await createProviderCheckout({
      providerCode: provider.code,
      amount,
      currency,
      paymentMethodCode,
      merchantTransactionId:
        transaction.paymentReference || paymentReference,
      customer: customer || draft.customer || {},
      draftId: draft._id,
      paymentConfigurationId: paymentConfiguration._id,
      returnUrl: providerReturnUrl,
      providerConfig: buildProviderConfig(provider),
    });

    const checkoutResult = extractCheckoutResult(checkout);

    if (!checkoutResult.checkoutId) {
      throw new AppError(
        "لم يُرجع مزود الدفع معرف Checkout صالحًا",
        502,
        "checkoutId",
      );
    }

    /*
    Stripe تستخدم Idempotency Key بنفس paymentReference.
    عند إعادة فتح الدفع نسترجع الجلسة نفسها دون تسجيل
    CHECKOUT_CREATED أو STATUS_CHANGED مرة أخرى.
    */
    if (existingCheckout && providerCode === "STRIPE") {
      return buildCheckoutResponse({
        transaction,
        provider,
        paymentMethodCode,
        checkoutResult,
      });
    }

    await attachProviderCheckoutService({
      transactionId: transaction._id,
      ...checkoutResult,
      metadata: {
        providerResultCode: checkout?.result?.code || "",
        providerResultDescription:
          checkout?.result?.description || "",
      },
      updatedBy: actorId,
      source: PAYMENT_TRANSACTION_EVENT_SOURCES.PROVIDER,
    });

    const updatedTransaction = await updatePaymentTransactionStatusService({
      transactionId: transaction._id,
      toStatus: PAYMENT_TRANSACTION_STATUSES.PROCESSING,
      source: PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
      eventCode: PAYMENT_TRANSACTION_EVENT_CODES.STATUS_CHANGED,
      message: "Provider checkout is ready",
      providerReference: checkoutResult.providerReference,
      updatedBy: actorId,
    });

    return buildCheckoutResponse({
      transaction: updatedTransaction,
      provider,
      paymentMethodCode,
      checkoutResult,
    });
  } catch (checkoutError) {
    await markPaymentTransactionFailedService({
      transactionId: transaction._id,
      reason:
        checkoutError?.message || "Provider checkout creation failed",
      source: PAYMENT_TRANSACTION_EVENT_SOURCES.PROVIDER,
      updatedBy: actorId,
    });

    throw checkoutError;
  }
};

export const createProviderCheckoutService = async ({
  draft,
  configuration,
  pricing,
  customer,
  returnUrl,
  req,
}) => {
  if (!draft?._id) {
    throw new AppError(
      "مسودة الحجز غير موجودة",
      404,
      "draftBooking",
    );
  }

  void pricing;

  return createPaymentCheckoutSessionService({
    draftId: draft._id,
    paymentConfiguration: configuration,
    customer,
    returnUrl,
    req,
  });
};
