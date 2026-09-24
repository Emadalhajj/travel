import test from "node:test";
import assert from "node:assert/strict";

import paymentTransactionRoutes from "../../routes/payment/paymentTransaction-route.js";
import publicPaymentRoutes from "../../routes/payment/public-payment-routes.js";

const getRoutePaths = (router) =>
  router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);

test("legacy payment transaction router does not shadow the public status route", () => {
  assert.equal(
    getRoutePaths(paymentTransactionRoutes).includes(
      "/public/payments/:transactionId/status",
    ),
    false,
  );
});

test("public payment router owns the canonical transaction status route", () => {
  const statusLayer = publicPaymentRoutes.stack.find(
    (layer) => layer.route?.path === "/:transactionId/status",
  );

  assert.ok(statusLayer);
  assert.equal(statusLayer.route.methods.get, true);
  assert.ok(statusLayer.route.stack.length >= 3);
});
