import AppError from "../utils/AppError.js";

const toBoundedInteger = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
};

export const getDuffelConfig = (environment = process.env) => {
  const supplierTimeoutMs = toBoundedInteger(
    environment.DUFFEL_SUPPLIER_TIMEOUT_MS,
    15000,
    2000,
    60000,
  );
  const httpTimeoutMs = toBoundedInteger(
    environment.DUFFEL_HTTP_TIMEOUT_MS,
    20000,
    3000,
    65000,
  );

  if (!String(environment.DUFFEL_ACCESS_TOKEN || "").trim()) {
    throw new AppError("FLIGHT_PROVIDER_NOT_CONFIGURED", 503, "provider");
  }
  if (supplierTimeoutMs >= httpTimeoutMs) {
    throw new AppError("FLIGHT_PROVIDER_TIMEOUT_CONFIG_INVALID", 500, "provider");
  }

  return Object.freeze({
    baseUrl: String(environment.DUFFEL_BASE_URL || "https://api.duffel.com").replace(/\/$/, ""),
    accessToken: String(environment.DUFFEL_ACCESS_TOKEN).trim(),

    apiVersion: String(environment.DUFFEL_API_VERSION || "v2").trim(),
    supplierTimeoutMs,
    httpTimeoutMs,
  });
};
