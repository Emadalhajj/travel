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

test("bank and manual payments acquire the same deterministic inventory hold", async () => {
  const source = await readService("../../services/payment/initialize-public-payment-service.js");
  const helper = source.indexOf("const initializeNonProviderPaymentResources");
  const bank = source.indexOf("const initializeBankTransfer");
  const manual = source.indexOf("const initializeManualPayment");

  assert.ok(helper >= 0);
  assert.ok(source.indexOf("ensureDraftInventoryHoldService", helper) > helper);
  assert.ok(source.indexOf("`payment:${transaction._id}`", helper) > helper);
  assert.ok(source.indexOf("initializeNonProviderPaymentResources", bank) > bank);
  assert.ok(source.indexOf("initializeNonProviderPaymentResources", manual) > manual);
  assert.ok(source.includes("releaseInventoryHoldService"));
  assert.ok(source.includes("markPaymentTransactionFailedService"));
});

test("all public payment paths revalidate accommodation before pricing and transaction creation", async () => {
  const publicPayment = await readService("../../services/payment/initialize-public-payment-service.js");
  const providerPayment = await readService("../../services/payment/payment-checkout-service.js");

  const publicAvailability = publicPayment.indexOf("await assertDraftAccommodationAvailable(draft)");
  const publicQuote = publicPayment.indexOf("await buildAuthoritativeDraftQuote", publicAvailability);
  const providerAvailability = providerPayment.indexOf("await assertDraftAccommodationAvailable(draft)");
  const providerQuote = providerPayment.indexOf("await buildAuthoritativeDraftQuote", providerAvailability);

  assert.ok(publicAvailability >= 0);
  assert.ok(publicQuote > publicAvailability);
  assert.ok(providerAvailability >= 0);
  assert.ok(providerQuote > providerAvailability);
});

test("provider completion resolves hold internally and passes it to conversion", async () => {
  const source = await readService("../../services/payment/complete-provider-payment-service.js");

  assert.ok(source.includes("findInventoryHoldByPaymentTransactionService"));
  assert.ok(source.includes("getInventoryHoldForCommitService"));
  assert.ok(source.includes("inventoryHoldId:"));
  assert.ok(source.includes("releaseInventoryHoldService"));
});

test("bank transfer approval reuses the payment hold during booking conversion", async () => {
  const source = await readService(
    "../../services/payment/bank-transfer-review-service.js",
  );

  assert.ok(source.includes("findInventoryHoldByPaymentTransactionService"));
  assert.ok(source.includes("getInventoryHoldForCommitService"));

  const holdLookup = source.indexOf(
    "await findInventoryHoldByPaymentTransactionService",
  );
  const holdValidation = source.indexOf(
    "await getInventoryHoldForCommitService",
    holdLookup,
  );
  const conversion = source.indexOf(
    "await convertDraftToBooking",
    holdValidation,
  );
  const passedHold = source.indexOf(
    "inventoryHoldId:",
    conversion,
  );

  assert.ok(holdLookup >= 0);
  assert.ok(holdValidation > holdLookup);
  assert.ok(conversion > holdValidation);
  assert.ok(passedHold > conversion);
  assert.ok(source.includes("holdForConversion?._id || null"));
});

test("bank transfer rejection releases its linked payment hold idempotently", async () => {
  const source = await readService(
    "../../services/payment/bank-transfer-review-service.js",
  );
  const rejection = source.indexOf(
    "export const rejectBankTransferService",
  );
  const transition = source.indexOf(
    "PAYMENT_TRANSACTION_STATUSES.REJECTED",
    rejection,
  );
  const draftRestore = source.indexOf(
    "await restoreDraftAfterPaymentRejectionService",
    transition,
  );
  const holdLookup = source.indexOf(
    "await findInventoryHoldByPaymentTransactionService",
    draftRestore,
  );
  const holdRelease = source.indexOf(
    "await releaseInventoryHoldService",
    holdLookup,
  );

  assert.ok(rejection >= 0);
  assert.ok(transition > rejection);
  assert.ok(draftRestore > transition);
  assert.ok(holdLookup > draftRestore);
  assert.ok(holdRelease > holdLookup);
  assert.ok(source.includes('reason: "bank_transfer_rejected"'));
  assert.ok(source.includes("const alreadyRejected ="));
  assert.ok(source.includes("if (!alreadyRejected)"));
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
