import {
  acquirePaymentBookingConversionLockService,
  findPaymentTransactionsForRecoveryService,
  findPaymentTransactionService,
  recordBookingConversionFailureService,
  recordPaymentTransactionEventService,
  releasePaymentBookingConversionLockService,
  updatePaymentTransactionStatusService,
} from "./paymentTransaction-service.js";
import {
  findInventoryHoldByPaymentTransactionService,
  findInventoryHoldsForRecoveryService,
  getInventoryHoldForCommitService,
  releaseInventoryHoldService,
} from "../booking/inventory-hold-service.js";
import {
  convertDraftToBooking,
  expireOldDraftBookings,
} from "../draft-bookings/draft-booking-service.js";
import {
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";
import {
  PAYMENT_TRANSACTION_EVENT_CODES,
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";
import { INVENTORY_HOLD_STATUSES } from "../../constants/inventory/inventory-hold-statuses.js";
import {
  sendPaidPendingBookingNotification,
  sendPaymentReceivedNotification,
} from "../notifications/payment-notification-service.js";
import { mapWithConcurrency } from "../../utils/async/mapWithConcurrency.js";

const PAID_RECOVERY_CONCURRENCY = 5;
const HOLD_RECOVERY_CONCURRENCY = 10;

const PAID_RECOVERY_STATUSES = Object.freeze([
  PAYMENT_TRANSACTION_STATUSES.CAPTURED,
  PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
]);

const FINANCIALLY_CONFIRMED_STATUSES = new Set([
  ...PAID_RECOVERY_STATUSES,
  PAYMENT_TRANSACTION_STATUSES.SUCCESS,
  LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
]);

const TERMINAL_UNPAID_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.FAILED,
  PAYMENT_TRANSACTION_STATUSES.REJECTED,
  PAYMENT_TRANSACTION_STATUSES.CANCELED,
  PAYMENT_TRANSACTION_STATUSES.EXPIRED,
]);

const EXPIRABLE_PAYMENT_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.INITIATED,
  PAYMENT_TRANSACTION_STATUSES.PENDING,
  PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF,
  PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL,
  PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
  PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
  PAYMENT_TRANSACTION_STATUSES.PROCESSING,
  PAYMENT_TRANSACTION_STATUSES.AUTHORIZED,
]);

export const createPaymentRecoveryServiceLayer = ({
  findTransactions = findPaymentTransactionsForRecoveryService,
  findTransaction = findPaymentTransactionService,
  findHoldByPayment = findInventoryHoldByPaymentTransactionService,
  findHolds = findInventoryHoldsForRecoveryService,
  getHoldForCommit = getInventoryHoldForCommitService,
  releaseHold = releaseInventoryHoldService,
  acquireConversionLock = acquirePaymentBookingConversionLockService,
  releaseConversionLock = releasePaymentBookingConversionLockService,
  convertDraft = convertDraftToBooking,
  updateTransactionStatus = updatePaymentTransactionStatusService,
  recordConversionFailure = recordBookingConversionFailureService,
  recordTransactionEvent = recordPaymentTransactionEventService,
  expireDrafts = expireOldDraftBookings,
  sendPaymentReceived = sendPaymentReceivedNotification,
  sendPaidPending = sendPaidPendingBookingNotification,
} = {}) => {
  const recoverPaidTransaction = async ({ transaction, req }) => {
    const lock = await acquireConversionLock({ transactionId: transaction._id });
    if (!lock) return { status: "skipped_locked", transactionId: transaction._id };

    try {
      const linkedHold = await findHoldByPayment({
        paymentTransaction: transaction._id,
      });
      const hold = linkedHold?._id
        ? await getHoldForCommit({
            holdId: linkedHold._id,
            draftBooking: transaction.draftBooking,
            paymentTransaction: transaction._id,
            allowExpired: true,
          })
        : null;

      await recordTransactionEvent({
        transactionId: transaction._id,
        fromStatus: transaction.status,
        toStatus: transaction.status,
        source: PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
        eventCode: PAYMENT_TRANSACTION_EVENT_CODES.BOOKING_CONVERSION_STARTED,
        message: "Automatic booking conversion recovery started",
        providerReference: transaction.providerReference,
      });

      const result = await convertDraft({
        draftId: transaction.draftBooking,
        userId: transaction.user || null,
        req,
        paymentData: {
          paymentMethod: transaction.methodCode,
          paidAmount: transaction.amount,
          transactionId: transaction.providerReference,
          paymentReference: transaction.paymentReference,
          gateway: transaction.providerCode,
          currency: transaction.currency,
          paymentTransactionId: transaction._id,
        },
        inventoryHoldId: hold?._id || null,
        allowExpiredInventoryHold: true,
      });
      const booking = result?.booking || result;

      if (!booking?._id) throw new Error("Recovery conversion returned no booking");

      await updateTransactionStatus({
        transactionId: transaction._id,
        toStatus: PAYMENT_TRANSACTION_STATUSES.SUCCESS,
        source: PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
        eventCode: PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_SUCCEEDED,
        message: "Paid booking recovered successfully",
        extraUpdates: { booking: booking._id },
      });

      await sendPaymentReceived({
        transaction,
        booking,
        req,
      });

      return {
        status: "recovered",
        transactionId: transaction._id,
        bookingId: booking._id,
      };
    } catch (error) {
      const failedTransaction = await recordConversionFailure({
        transactionId: transaction._id,
        reason: error?.message || "Automatic booking recovery failed",
        source: PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
      });
      await sendPaidPending({
        transaction: failedTransaction || transaction,
        req,
      });
      return {
        status: "failed",
        transactionId: transaction._id,
        error: error?.message || "Automatic booking recovery failed",
      };
    } finally {
      await releaseConversionLock({ transactionId: transaction._id });
    }
  };

  const recoverPaidPendingBookings = async ({ limit = 100, req = null } = {}) => {
    const transactions = await findTransactions({
      statuses: PAID_RECOVERY_STATUSES,
      bookingIsNull: true,
      requireDraft: true,
      limit,
    });
    const results = await mapWithConcurrency(
      transactions,
      PAID_RECOVERY_CONCURRENCY,
      (transaction) => recoverPaidTransaction({ transaction, req }),
    );
    return {
      processed: results.length,
      recovered: results.filter(({ status }) => status === "recovered").length,
      failed: results.filter(({ status }) => status === "failed").length,
      skipped: results.filter(({ status }) => status === "skipped_locked").length,
      results,
    };
  };

  const recoverExpiredPaymentHolds = async ({
    recoveryNow = new Date(),
    limit = 100,
    req = null,
  } = {}) => {
    const holds = await findHolds({ recoveryNow, limit });
    const results = await mapWithConcurrency(
      holds,
      HOLD_RECOVERY_CONCURRENCY,
      async (hold) => {
      let transaction = null;
      if (hold.paymentTransaction) {
        try {
          transaction = await findTransaction({ transactionId: hold.paymentTransaction });
        } catch (error) {
          if (error?.statusCode !== 404 && error?.status !== 404) throw error;
        }
      }

      if (transaction && FINANCIALLY_CONFIRMED_STATUSES.has(transaction.status)) {
        return { holdId: hold._id, status: "kept_paid" };
      }

      const isExpired = new Date(hold.expiresAt) <= recoveryNow;
      const isLeakedTerminal = transaction && TERMINAL_UNPAID_STATUSES.has(transaction.status);
      const isReleaseRetry = hold.status === INVENTORY_HOLD_STATUSES.RELEASE_FAILED;

      if (!isExpired && !isLeakedTerminal && !isReleaseRetry) return null;

      try {
        await releaseHold({
          holdId: hold._id,
          reason: isExpired ? "expired" : "payment_terminal_cleanup",
          req,
          expiration: isExpired,
        });

        if (
          transaction &&
          isExpired &&
          EXPIRABLE_PAYMENT_STATUSES.has(transaction.status)
        ) {
          await updateTransactionStatus({
            transactionId: transaction._id,
            toStatus: PAYMENT_TRANSACTION_STATUSES.EXPIRED,
            source: PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
            eventCode: PAYMENT_TRANSACTION_EVENT_CODES.STATUS_CHANGED,
            message: "Payment expired after inventory hold expiration",
          });
        }
        return { holdId: hold._id, status: isExpired ? "expired" : "released" };
      } catch (error) {
        return {
          holdId: hold._id,
          status: "failed",
          error: error?.message || "Hold recovery failed",
        };
      }
      },
    );
    const processedResults = results.filter(Boolean);

    return {
      processed: processedResults.length,
      expired: processedResults.filter(({ status }) => status === "expired").length,
      released: processedResults.filter(({ status }) => status === "released").length,
      keptPaid: processedResults.filter(({ status }) => status === "kept_paid").length,
      failed: processedResults.filter(({ status }) => status === "failed").length,
      results: processedResults,
    };
  };

  const runRecovery = async ({ recoveryNow = new Date(), limit = 100, req = null } = {}) => {
    const paidRecovery = await recoverPaidPendingBookings({ limit, req });
    const holdRecovery = await recoverExpiredPaymentHolds({ recoveryNow, limit, req });
    const stillPendingPaid = await findTransactions({
      statuses: PAID_RECOVERY_STATUSES,
      bookingIsNull: true,
      requireDraft: true,
      limit: 500,
    });
    const excludedDraftIds = stillPendingPaid
      .map((transaction) => transaction.draftBooking)
      .filter(Boolean);
    const draftExpiration = await expireDrafts({
      now: recoveryNow,
      excludedDraftIds,
    });

    return { paidRecovery, holdRecovery, draftExpiration };
  };

  return {
    recoverPaidPendingBookingsService: recoverPaidPendingBookings,
    recoverExpiredPaymentHoldsService: recoverExpiredPaymentHolds,
    runPaymentRecoveryService: runRecovery,
  };
};

const paymentRecoveryServices = createPaymentRecoveryServiceLayer();

export const recoverPaidPendingBookingsService =
  paymentRecoveryServices.recoverPaidPendingBookingsService;
export const recoverExpiredPaymentHoldsService =
  paymentRecoveryServices.recoverExpiredPaymentHoldsService;
export const runPaymentRecoveryService =
  paymentRecoveryServices.runPaymentRecoveryService;
