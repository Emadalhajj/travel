import AppError from "../../../utils/AppError.js";

import {
  cancelHyperPayPayment,
  captureHyperPayPayment,
  createHyperPayCheckout,
  refundHyperPayPayment,
  verifyHyperPayPayment,
} from "../hyperpay-service.js";

import {
  cancelStripePayment,
  captureStripePayment,
  createStripeCheckoutSession,
  getStripeEmbeddedCheckoutPresentation,
  refundStripePayment,
  verifyStripePayment,
} from "../stripe-service.js";

export const getProviderCheckoutPresentation = async ({
  providerCode,
  checkoutId,
  providerConfig,
  redirectUrl = "",
}) => {
  const code = String(
    providerCode || "",
  ).toUpperCase();

  if (code === "STRIPE") {
    return getStripeEmbeddedCheckoutPresentation({
      checkoutId,
      providerConfig,
    });
  }

  return {
    presentationMode: "REDIRECT",
    redirectUrl,
  };
};

export const SUPPORTED_PAYMENT_PROVIDER_CODES = Object.freeze([
  "HYPERPAY",
  "STRIPE",
]);

export const isPaymentProviderAdapterSupported = (providerCode) =>
  SUPPORTED_PAYMENT_PROVIDER_CODES.includes(
    String(providerCode || "").trim().toUpperCase(),
  );

export const createProviderCheckout = async ({
  providerCode,
  amount,
  currency,
  paymentMethodCode,
  merchantTransactionId,
  customer,
  draftId,
  paymentConfigurationId,
  returnUrl,
  providerConfig,
}) => {
  const normalizedProviderCode = String(
    providerCode || "",
  ).toUpperCase();

  switch (normalizedProviderCode) {
    case "HYPERPAY":
      return createHyperPayCheckout({
        amount,
        currency,
        paymentMethodCode,
        merchantTransactionId,
        customer,
        draftId,
        paymentConfigurationId,
        returnUrl,
        providerConfig,
      });

    case "STRIPE":
      return createStripeCheckoutSession({
        amount,
        currency,
        paymentMethodCode,
        merchantTransactionId,
        customer,
        draftId,
        paymentConfigurationId,
        returnUrl,
        providerConfig,
      });

    default:
      throw new AppError(
        "PAYMENT_PROVIDER_UNSUPPORTED",
        400,
        "providerCode",
        { provider: normalizedProviderCode },
      );
  }
};


/*
=====================================================
Verify Provider Payment
=====================================================

يوحد التحقق من نتيجة الدفع بين المزودين.
الـFactory لا يتعامل مع MongoDB.
=====================================================
*/

export const verifyProviderPayment = async ({
  providerCode,
  checkoutId,
  resourcePath,
  providerConfig,
}) => {
  const normalizedProviderCode = String(
    providerCode || "",
  ).toUpperCase();

  switch (normalizedProviderCode) {
    case "HYPERPAY":
      return verifyHyperPayPayment({
        checkoutId,
        resourcePath,
        providerConfig,
      });

    case "STRIPE":
      return verifyStripePayment({
        checkoutId,
        providerConfig,
      });

    default:
      throw new AppError(
        "PAYMENT_PROVIDER_UNSUPPORTED",
        400,
        "providerCode",
        { provider: normalizedProviderCode },
      );
  }
};

const executeProviderOperation = async ({
  operation,
  providerCode,
  ...payload
}) => {
  const code = String(providerCode || "").toUpperCase();
  if (!isPaymentProviderAdapterSupported(code)) {
    throw new AppError(
      "PAYMENT_PROVIDER_UNSUPPORTED",
      400,
      "providerCode",
      { provider: code },
    );
  }

  const operations = {
    HYPERPAY: {
      capture: captureHyperPayPayment,
      refund: refundHyperPayPayment,
      cancel: cancelHyperPayPayment,
    },
    STRIPE: {
      capture: captureStripePayment,
      refund: refundStripePayment,
      cancel: cancelStripePayment,
    },
  };

  return operations[code][operation](payload);
};

export const captureProviderPayment = (payload) =>
  executeProviderOperation({ operation: "capture", ...payload });

export const refundProviderPayment = (payload) =>
  executeProviderOperation({ operation: "refund", ...payload });

export const cancelProviderPayment = (payload) =>
  executeProviderOperation({ operation: "cancel", ...payload });
