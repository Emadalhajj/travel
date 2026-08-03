import AppError from "../../../utils/AppError.js";

import {
  cancelHyperPayPayment,
  captureHyperPayPayment,
  createHyperPayCheckout,
  refundHyperPayPayment,
  verifyHyperPayPayment,
} from "../hyperpay-service.js";

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

    default:
      throw new AppError(
        `مزود الدفع ${normalizedProviderCode} غير مدعوم`,
        400,
        "providerCode",
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

    default:
      throw new AppError(
        `مزود الدفع ${normalizedProviderCode} غير مدعوم`,
        400,
        "providerCode",
      );
  }
};

const executeProviderOperation = async ({
  operation,
  providerCode,
  ...payload
}) => {
  const code = String(providerCode || "").toUpperCase();
  if (code !== "HYPERPAY") {
    throw new AppError(`مزود الدفع ${code} غير مدعوم`, 400, "providerCode");
  }

  const operations = {
    capture: captureHyperPayPayment,
    refund: refundHyperPayPayment,
    cancel: cancelHyperPayPayment,
  };

  return operations[operation](payload);
};

export const captureProviderPayment = (payload) =>
  executeProviderOperation({ operation: "capture", ...payload });

export const refundProviderPayment = (payload) =>
  executeProviderOperation({ operation: "refund", ...payload });

export const cancelProviderPayment = (payload) =>
  executeProviderOperation({ operation: "cancel", ...payload });
