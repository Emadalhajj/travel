import assert from "node:assert/strict";
import test from "node:test";

import { INVENTORY_HOLD_STATUSES } from "../../constants/inventory/inventory-hold-statuses.js";
import { PAYMENT_TRANSACTION_STATUSES } from "../../constants/payments/payment-transaction-statuses.js";
import { createPaymentRecoveryServiceLayer } from "../../services/payment/payment-recovery-service.js";
import { createPaymentRecoveryJobRunner } from "../../jobs/payment-recovery-job.js";

const RECOVERY_NOW = new Date("2026-10-01T12:00:00.000Z");

test("payment recovery runner skips an overlapping run", async () => {
  let finishRun;
  let calls = 0;
  const runner = createPaymentRecoveryJobRunner({
    runJob: async () => {
      calls += 1;
      await new Promise((resolve) => {
        finishRun = resolve;
      });
      return { processed: 1 };
    },
  });

  const firstRun = runner.run();
  await Promise.resolve();
  const overlappingRun = await runner.run();

  assert.deepEqual(overlappingRun, { skipped: true, reason: "overlap" });
  assert.equal(calls, 1);
  assert.equal(runner.isRunning(), true);

  finishRun();
  await firstRun;
  assert.equal(runner.isRunning(), false);
});

const setup = ({
  transactionStatus = PAYMENT_TRANSACTION_STATUSES.PROCESSING,
  holdStatus = INVENTORY_HOLD_STATUSES.HELD,
  holdExpiresAt = "2026-10-01T11:00:00.000Z",
  conversionFails = false,
  releaseFailures = 0,
} = {}) => {
  const transaction = {
    _id: "payment-1",
    status: transactionStatus,
    booking: null,
    draftBooking: "draft-1",
    user: "user-1",
    methodCode: "VISA",
    amount: 100,
    currency: "SAR",
    providerCode: "STRIPE",
    providerReference: "provider-1",
    paymentReference: "PAY-1",
  };
  const hold = {
    _id: "hold-1",
    status: holdStatus,
    isActive: true,
    paymentTransaction: transaction._id,
    draftBooking: transaction.draftBooking,
    expiresAt: new Date(holdExpiresAt),
  };
  let inventoryReserved = 2;
  let releaseAttempts = 0;
  let conversionCalls = 0;
  let lockHeld = false;
  let bookingSequence = 0;
  let expiredDraftInput = null;

  const findTransactions = async ({ statuses, bookingIsNull }) =>
    statuses.includes(transaction.status) && (!bookingIsNull || !transaction.booking)
      ? [transaction]
      : [];

  const services = createPaymentRecoveryServiceLayer({
    findTransactions,
    findTransaction: async () => transaction,
    findHoldByPayment: async () => hold,
    findHolds: async () =>
      hold.isActive && [INVENTORY_HOLD_STATUSES.HELD, INVENTORY_HOLD_STATUSES.RELEASE_FAILED].includes(hold.status)
        ? [hold]
        : [],
    getHoldForCommit: async () => hold,
    releaseHold: async ({ expiration }) => {
      releaseAttempts += 1;
      if (releaseAttempts <= releaseFailures) {
        hold.status = INVENTORY_HOLD_STATUSES.RELEASE_FAILED;
        throw new Error("release failed");
      }
      hold.status = expiration
        ? INVENTORY_HOLD_STATUSES.EXPIRED
        : INVENTORY_HOLD_STATUSES.RELEASED;
      hold.isActive = false;
      inventoryReserved = 0;
      return hold;
    },
    acquireConversionLock: async () => {
      if (lockHeld) return null;
      lockHeld = true;
      return { _id: transaction._id };
    },
    releaseConversionLock: async () => {
      lockHeld = false;
    },
    convertDraft: async () => {
      conversionCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (conversionFails) throw new Error("conversion failed");
      const booking = { _id: `booking-${++bookingSequence}` };
      transaction.booking = booking._id;
      hold.status = INVENTORY_HOLD_STATUSES.COMMITTED;
      hold.isActive = false;
      return { booking };
    },
    updateTransactionStatus: async ({ toStatus, extraUpdates = {} }) => {
      transaction.status = toStatus;
      Object.assign(transaction, extraUpdates);
      return transaction;
    },
    recordConversionFailure: async () => {
      transaction.status = PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING;
      return transaction;
    },
    recordTransactionEvent: async () => null,
    expireDrafts: async (input) => {
      expiredDraftInput = input;
      return { modifiedCount: 0 };
    },
    sendPaymentReceived: async () => null,
    sendPaidPending: async () => null,
  });

  return {
    ...services,
    transaction,
    hold,
    state: () => ({ inventoryReserved, releaseAttempts, conversionCalls, expiredDraftInput }),
  };
};

test("expired unpaid checkout releases inventory and expires its transaction", async () => {
  const fixture = setup();
  const result = await fixture.recoverExpiredPaymentHoldsService({ recoveryNow: RECOVERY_NOW });

  assert.equal(result.expired, 1);
  assert.equal(fixture.hold.status, INVENTORY_HOLD_STATUSES.EXPIRED);
  assert.equal(fixture.transaction.status, PAYMENT_TRANSACTION_STATUSES.EXPIRED);
  assert.equal(fixture.state().inventoryReserved, 0);
});

test("failed hold release remains retryable and succeeds on next recovery", async () => {
  const fixture = setup({ releaseFailures: 1 });
  const first = await fixture.recoverExpiredPaymentHoldsService({ recoveryNow: RECOVERY_NOW });
  const second = await fixture.recoverExpiredPaymentHoldsService({ recoveryNow: RECOVERY_NOW });

  assert.equal(first.failed, 1);
  assert.equal(second.expired, 1);
  assert.equal(fixture.state().releaseAttempts, 2);
  assert.equal(fixture.state().inventoryReserved, 0);
});

test("captured payment is recovered and its expired hold is never released", async () => {
  const fixture = setup({ transactionStatus: PAYMENT_TRANSACTION_STATUSES.CAPTURED });
  const result = await fixture.runPaymentRecoveryService({ recoveryNow: RECOVERY_NOW });

  assert.equal(result.paidRecovery.recovered, 1);
  assert.equal(fixture.transaction.status, PAYMENT_TRANSACTION_STATUSES.SUCCESS);
  assert.equal(fixture.hold.status, INVENTORY_HOLD_STATUSES.COMMITTED);
  assert.equal(fixture.state().inventoryReserved, 2);
  assert.equal(fixture.state().releaseAttempts, 0);
});

test("paid pending booking recovery creates booking and completes payment", async () => {
  const fixture = setup({
    transactionStatus: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
    holdExpiresAt: "2026-10-01T13:00:00.000Z",
  });
  const result = await fixture.recoverPaidPendingBookingsService();

  assert.equal(result.recovered, 1);
  assert.equal(fixture.transaction.status, PAYMENT_TRANSACTION_STATUSES.SUCCESS);
  assert.equal(fixture.transaction.booking, "booking-1");
  assert.equal(fixture.hold.status, INVENTORY_HOLD_STATUSES.COMMITTED);
});

test("failed paid conversion keeps payment pending and inventory held", async () => {
  const fixture = setup({
    transactionStatus: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
    conversionFails: true,
  });
  const result = await fixture.recoverPaidPendingBookingsService();

  assert.equal(result.failed, 1);
  assert.equal(fixture.transaction.status, PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING);
  assert.equal(fixture.hold.status, INVENTORY_HOLD_STATUSES.HELD);
  assert.equal(fixture.state().inventoryReserved, 2);
});

test("two recovery workers convert a paid transaction only once", async () => {
  const fixture = setup({ transactionStatus: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING });
  const [first, second] = await Promise.all([
    fixture.recoverPaidPendingBookingsService(),
    fixture.recoverPaidPendingBookingsService(),
  ]);

  assert.equal(first.recovered + second.recovered, 1);
  assert.equal(first.skipped + second.skipped, 1);
  assert.equal(fixture.state().conversionCalls, 1);
  assert.equal(fixture.transaction.booking, "booking-1");
});

test("failed transaction with a leaked hold releases inventory", async () => {
  const fixture = setup({
    transactionStatus: PAYMENT_TRANSACTION_STATUSES.FAILED,
    holdExpiresAt: "2026-10-01T13:00:00.000Z",
  });
  const result = await fixture.recoverExpiredPaymentHoldsService({ recoveryNow: RECOVERY_NOW });

  assert.equal(result.released, 1);
  assert.equal(fixture.hold.status, INVENTORY_HOLD_STATUSES.RELEASED);
  assert.equal(fixture.state().inventoryReserved, 0);
});

test("successful transaction is ignored by recovery", async () => {
  const fixture = setup({ transactionStatus: PAYMENT_TRANSACTION_STATUSES.SUCCESS });
  const result = await fixture.runPaymentRecoveryService({ recoveryNow: RECOVERY_NOW });

  assert.equal(result.paidRecovery.processed, 0);
  assert.equal(result.holdRecovery.keptPaid, 1);
  assert.equal(fixture.state().conversionCalls, 0);
  assert.equal(fixture.state().releaseAttempts, 0);
});

test("paid booking recovery never exceeds five concurrent conversions", async () => {
  const transactions = Array.from({ length: 8 }, (_, index) => ({
    _id: `payment-${index}`,
    status: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
    draftBooking: `draft-${index}`,
  }));
  let active = 0;
  let maximumActive = 0;
  const service = createPaymentRecoveryServiceLayer({
    findTransactions: async () => transactions,
    acquireConversionLock: async ({ transactionId }) => ({ _id: transactionId }),
    releaseConversionLock: async () => {},
    findHoldByPayment: async () => null,
    recordTransactionEvent: async () => {},
    convertDraft: async ({ draftId }) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { booking: { _id: `booking-${draftId}` } };
    },
    updateTransactionStatus: async () => {},
    recordConversionFailure: async () => {},
    sendPaymentReceived: async () => {},
    sendPaidPending: async () => {},
  });

  const result = await service.recoverPaidPendingBookingsService();
  assert.equal(maximumActive, 5);
  assert.equal(result.recovered, 8);
});

test("expired hold recovery limits releases to ten and isolates worker failures", async () => {
  const holds = Array.from({ length: 12 }, (_, index) => ({
    _id: `hold-${index}`,
    expiresAt: new Date("2026-10-01T11:00:00.000Z"),
    status: INVENTORY_HOLD_STATUSES.HELD,
  }));
  let active = 0;
  let maximumActive = 0;
  const service = createPaymentRecoveryServiceLayer({
    findHolds: async () => holds,
    releaseHold: async ({ holdId }) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      if (holdId === "hold-3") throw new Error("isolated failure");
    },
  });

  const result = await service.recoverExpiredPaymentHoldsService({ recoveryNow: RECOVERY_NOW });
  assert.equal(maximumActive, 10);
  assert.equal(result.processed, 12);
  assert.equal(result.expired, 11);
  assert.equal(result.failed, 1);
});
