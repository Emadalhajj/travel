import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readService = (path) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("provider checkout acquires a hold before reusing or creating checkout", async () => {
  const source = await readService("../../services/payment/payment-checkout-service.js");
  const holdCall = source.indexOf("hold = await ensureCheckoutInventoryHold");
  const existingBranch = source.indexOf("if (existingCheckout)", holdCall);
  const providerCall = source.indexOf("const checkout = await createProviderCheckout", holdCall);

  assert.ok(holdCall >= 0);
  assert.ok(existingBranch > holdCall);
  assert.ok(providerCall > existingBranch);
  assert.ok(source.includes("releaseCheckoutHoldBestEffort"));
  assert.ok(source.includes("updateInventoryHoldExpiryService"));
});

test("provider completion resolves hold internally and passes it to conversion", async () => {
  const source = await readService("../../services/payment/complete-provider-payment-service.js");

  assert.ok(source.includes("findInventoryHoldByPaymentTransactionService"));
  assert.ok(source.includes("getInventoryHoldForCommitService"));
  assert.ok(source.includes("inventoryHoldId:"));
  assert.ok(source.includes("releaseInventoryHoldService"));
});

test("draft conversion skips legacy reservation and rollback when using a hold", async () => {
  const source = await readService("../../services/draft-bookings/draft-booking-service.js");

  assert.ok(source.includes("inventoryHoldId = null"));
  assert.ok(source.includes("if (!inventoryHold && draft.program?.programId)"));
  assert.ok(source.includes("if (!inventoryHold && inventoryReservations.length)"));
  assert.ok(source.includes("await commitInventoryHoldService"));
});
