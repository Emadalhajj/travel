export const hyperpayConfig = {
  baseUrl: process.env.HYPERPAY_BASE_URL || "https://eu-test.oppwa.com",
  entityId: process.env.HYPERPAY_ENTITY_ID,
  accessToken: process.env.HYPERPAY_ACCESS_TOKEN,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  currency: process.env.HYPERPAY_CURRENCY || "SAR",
};