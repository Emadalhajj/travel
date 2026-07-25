import AppError from "../../../utils/AppError.js";

import {
  createHyperPayCheckout,
} from "../hyperpay-service.js";

export const createProviderCheckout = async ({
  providerCode,
  ...payload
}) => {
  const normalizedProviderCode = String(
    providerCode || "",
  ).toUpperCase();

  switch (normalizedProviderCode) {
    case "HYPERPAY":
      return createHyperPayCheckout(payload);

    default:
      throw new AppError(
        `Unsupported payment provider: ${normalizedProviderCode}`,
        400,
        "paymentProvider",
      );
  }
};
