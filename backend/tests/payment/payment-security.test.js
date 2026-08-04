import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const auditFile = new URL(
  "../../services/audit/payment-transaction-audit-service.js",
  import.meta.url,
);

test("payment audit contract excludes raw secrets and gateway payload", async () => {
  const source = await readFile(auditFile, "utf8");

  assert.equal(source.includes("accessToken:"), false);
  assert.equal(source.includes("webhookSecret:"), false);
  assert.equal(source.includes("gatewayResponse:"), false);
  assert.equal(source.includes("credentials:"), false);
});

test("public payment status is an explicit allowlist", async () => {
  const serviceFile = new URL(
    "../../services/payment/paymentTransaction-service.js",
    import.meta.url,
  );
  const source = await readFile(serviceFile, "utf8");

  const marker = source.indexOf(
    "getPublicPaymentTransactionStatusService",
  );
  assert.ok(marker >= 0);

  const publicSection = source.slice(marker);
  assert.equal(publicSection.includes('"metadata"'), false);
  assert.equal(publicSection.includes('"events"'), false);
  assert.equal(publicSection.includes('"credentials"'), false);
  assert.equal(publicSection.includes('"gatewayResponse"'), false);
});
