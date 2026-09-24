import test from "node:test";
import assert from "node:assert/strict";

import { resolveAdminPaymentReference } from "../../services/payment/payment-transaction-admin-service.js";

test("admin payment reference uses the bank transfer reference when appropriate", () => {
  assert.equal(
    resolveAdminPaymentReference({ transferReference: "TRANSFER-123" }),
    "TRANSFER-123",
  );
});

test("provider and canonical payment references retain precedence", () => {
  assert.equal(
    resolveAdminPaymentReference({
      providerReference: "PROVIDER-123",
      transferReference: "TRANSFER-123",
    }),
    "PROVIDER-123",
  );
  assert.equal(
    resolveAdminPaymentReference({
      paymentReference: "PAYMENT-123",
      providerReference: "PROVIDER-123",
    }),
    "PAYMENT-123",
  );
});
