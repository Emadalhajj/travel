import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readService = (path) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("provider checkout acquires a hold before reusing or creating checkout", async () => {
  const source = await readService("../../services/payment/payment-checkout-service.js");
  const holdCall = source.indexOf("hold = await ensureDraftInventoryHoldService");
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

test("draft conversion uses only InventoryHold for external and direct conversion", async () => {
  const source = await readService("../../services/draft-bookings/draft-booking-service.js");

  assert.ok(source.includes("inventoryHoldId = null"));
  assert.ok(source.includes("booking-conversion:${draft._id}"));
  assert.ok(source.includes("ownsInventoryHold = Boolean(inventoryHold)"));
  assert.ok(source.includes("if (ownsInventoryHold && inventoryHold?._id)"));
  assert.ok(source.includes("await commitInventoryHoldService"));
  assert.equal(source.includes("reserveInventoryFromDraft"), false);
  assert.equal(source.includes("rollbackInventoryReservations"), false);
  assert.equal(source.includes("reserveInventory("), false);
  assert.equal(source.includes("releaseInventory("), false);
  assert.equal(source.includes("reserveProgramSeats("), false);
  assert.equal(source.includes("releaseProgramSeats("), false);
});

test("reused conversion is resolved before creating a system hold", async () => {
  const source = await readService("../../services/draft-bookings/draft-booking-service.js");
  const completedCheck = source.indexOf(
    "draft.status === DRAFT_BOOKING_STATUS.COMPLETED",
  );
  const systemHold = source.indexOf("booking-conversion:${draft._id}");

  assert.ok(completedCheck >= 0);
  assert.ok(systemHold > completedCheck);
});

test("payment checkout and conversion use deterministic hold keys", async () => {
  const checkout = await readService("../../services/payment/payment-checkout-service.js");
  const conversion = await readService("../../services/draft-bookings/draft-booking-service.js");

  assert.ok(checkout.includes("payment:${transaction._id}"));
  assert.ok(conversion.includes("booking-conversion:${draft._id}"));
  assert.equal(conversion.includes("booking-conversion:${draft._id}:${Date.now"), false);
});
