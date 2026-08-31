import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("user booking and draft queries include ownership in Mongo filters", () => {
  const bookings = read("../../controllers/booking/booking-controller.js");
  const drafts = read("../../services/draft-bookings/draft-booking-service.js");
  assert.match(bookings, /_id:\s*req\.params\.id,\s*user:\s*req\.user\._id/);
  assert.match(drafts, /_id:\s*draftId,\s*user:\s*userId,\s*isDeleted:\s*false/);
});

test("payment initialization and public payment state are authenticated and owner scoped", () => {
  const routes = read("../../routes/payment/public-payment-routes.js");
  const initializer = read("../../services/payment/initialize-public-payment-service.js");
  const transactions = read("../../services/payment/paymentTransaction-service.js");
  assert.match(routes, /"\/initialize",\s*protect,\s*paymentInitializeRateLimiter/);
  assert.match(routes, /"\/:transactionId\/status",\s*protect/);
  assert.match(initializer, /_id:\s*draftId,\s*user:\s*userId/);
  assert.match(transactions, /_id:\s*transactionId,\s*user:\s*userId/);
});

test("private booking and payment documents do not fall through public static uploads", () => {
  const server = read("../../server.js");
  const presets = read("../../middleware/upload/uploadPresets.js");
  const routes = read("../../routes/private-file-routes.js");
  assert.match(server, /"\/uploads\/draft-bookings"/);
  assert.match(server, /"\/uploads\/payment-proofs"/);
  assert.match(presets, /folder:\s*"payment-proofs",\s*storageRoot:\s*"private-uploads"/);
  assert.match(presets, /folder:\s*"draft-bookings",\s*storageRoot:\s*"private-uploads"/);
  assert.match(routes, /protect,\s*downloadDraftDocument/);
  assert.match(routes, /protect,\s*downloadPaymentProof/);
});

test("production security configuration fails closed and profile uploads use MIME validation", () => {
  const environment = read("../../config/environment.js");
  const server = read("../../server.js");
  const authRoutes = read("../../routes/auth-routes.js");
  const presets = read("../../middleware/upload/uploadPresets.js");
  assert.match(environment, /FRONTEND_URL is required in production/);
  assert.match(environment, /required\.push\("FRONTEND_URL", "JWT_EXPIRES_IN"\)/);
  assert.match(server, /app\.disable\("x-powered-by"\)/);
  assert.match(server, /helmet\(/);
  assert.match(authRoutes, /middleware\/upload\/index\.js/);
  assert.match(presets, /profileImage:[\s\S]*mimeTypes:\s*IMAGE_MIME_TYPES/);
});
