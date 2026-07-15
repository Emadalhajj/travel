import AppError from "../../utils/AppError.js";
import { hyperpayConfig } from "../../config/hyperpay.js";

export const createHyperPayCheckout = async ({
  amount,
  currency = "SAR",
  merchantTransactionId,
  customer = {},
  draftId,
}) => {
  if (!hyperpayConfig.entityId || !hyperpayConfig.accessToken) {
    throw new AppError("HyperPay credentials are missing", 500, "hyperpay");
  }

  const url = `${hyperpayConfig.baseUrl}/v1/checkouts`;

  const params = new URLSearchParams();

  params.append("entityId", hyperpayConfig.entityId);
  params.append("amount", Number(amount).toFixed(2));
  params.append("currency", currency);
  params.append("paymentType", "DB");
  params.append("merchantTransactionId", merchantTransactionId);

  params.append(
    "shopperResultUrl",
    `${hyperpayConfig.frontendUrl}/booking/payment/redirect/${draftId}?reference=${encodeURIComponent(
      merchantTransactionId,
    )}`,
  );

  if (customer.email) {
    params.append("customer.email", customer.email);
  }

  if (customer.name) {
    params.append("customer.givenName", customer.name);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hyperpayConfig.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || !data?.id) {
    throw new AppError(
      data?.result?.description || "Failed to create HyperPay checkout",
      400,
      "hyperpay",
    );
  }

  return data;
};
