export const hyperpayConfig = {
  entityId:
    process.env.HYPERPAY_ENTITY_ID || "",

  accessToken:
    process.env.HYPERPAY_ACCESS_TOKEN || "",

  webhookSecret:
    process.env.HYPERPAY_WEBHOOK_SECRET || "",

  baseUrl:
    process.env.HYPERPAY_BASE_URL ||
    "https://eu-test.oppwa.com",

  frontendUrl:
    process.env.FRONTEND_URL ||
    "http://localhost:3000",

  environment:
    process.env.HYPERPAY_ENVIRONMENT ||
    "test",
};