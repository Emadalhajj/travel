import AppError from "../../utils/AppError.js";
import { hyperpayConfig } from "../../config/hyperpay.js";

export const createHyperPayCheckout = async ({
  amount,
  currency = "SAR",
  merchantTransactionId,
  customer = {},
  draftId,
  providerConfig = {},
}) => {
  /*
  الأولوية:
  1- إعدادات المزود القادمة من قاعدة البيانات.
  2- إعدادات config/.env الحالية كـ fallback.
  */

  const entityId =
    providerConfig.entityId ||
    providerConfig.credentials?.entityId ||
    hyperpayConfig.entityId;

  const accessToken =
    providerConfig.accessToken ||
    providerConfig.credentials?.accessToken ||
    hyperpayConfig.accessToken;

  const baseUrl =
    providerConfig.baseUrl ||
    providerConfig.configuration?.baseUrl ||
    hyperpayConfig.baseUrl;

  const frontendUrl = (
    providerConfig.frontendUrl ||
    providerConfig.configuration?.frontendUrl ||
    hyperpayConfig.frontendUrl ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  if (!entityId || !accessToken) {
    throw new AppError(
      "HyperPay credentials are missing",
      500,
      "hyperpay",
    );
  }

  if (!baseUrl) {
    throw new AppError(
      "HyperPay base URL is missing",
      500,
      "hyperpay",
    );
  }

  const url = `${baseUrl}/v1/checkouts`;

  const params = new URLSearchParams();

  params.append("entityId", entityId);
  params.append(
    "amount",
    Number(amount).toFixed(2),
  );
  params.append("currency", currency);
  params.append("paymentType", "DB");

  params.append(
    "merchantTransactionId",
    merchantTransactionId,
  );

  params.append(
    "shopperResultUrl",
    `${frontendUrl}/booking/payment/redirect/${draftId}` +
      `?reference=${encodeURIComponent(
        merchantTransactionId,
      )}`,
  );

  if (customer.email) {
    params.append(
      "customer.email",
      customer.email,
    );
  }

  if (customer.name) {
    params.append(
      "customer.givenName",
      customer.name,
    );
  }

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type":
        "application/x-www-form-urlencoded",
    },

    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || !data?.id) {
    throw new AppError(
      data?.result?.description ||
        "Failed to create HyperPay checkout",
      400,
      "hyperpay",
    );
  }

  return data;
};