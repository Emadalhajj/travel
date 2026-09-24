/*
=====================================================
Bank Transfer Review Service
=====================================================

مسؤول عن اعتماد أو رفض التحويل البنكي إداريًا.
لا يتعامل Controller مباشرة مع PaymentTransaction.
=====================================================
*/

import AppError from "../../utils/AppError.js";

import {
  convertDraftToBooking,
  restoreDraftAfterPaymentRejectionService,
} from "../draft-bookings/draft-booking-service.js";

import {
  attachBookingToPaymentTransactionService,
  findPaymentTransactionService,
  recordBookingConversionFailureService,
  updatePaymentTransactionStatusService,
} from "./paymentTransaction-service.js";

import {
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

import {
  PAYMENT_TRANSACTION_EVENT_CODES,
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import {
  sendBankTransferApprovedNotification,
  sendBankTransferRejectedNotification,
  sendPaidPendingBookingNotification,
} from "../notifications/payment-notification-service.js";
import { fulfillExternalFlight } from "../trips/external-flight-fulfillment-service.js";
import { EXTERNAL_FULFILLMENT_STATUSES } from
  "../../constants/payments/external-fulfillment-statuses.js";
import {
  findInventoryHoldByPaymentTransactionService,
  getInventoryHoldForCommitService,
  releaseInventoryHoldService,
} from "../booking/inventory-hold-service.js";

const REVIEWABLE_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
  PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
]);

const getReviewableBankTransfer = async (
  transactionId,
) => {
  const transaction =
    await findPaymentTransactionService({
      transactionId,
    });

  if (
    !transaction.bankAccount ||
    transaction.paymentProvider
  ) {
    throw new AppError(
      "PAYMENT_NOT_BANK_TRANSFER",
      400,
      "transactionId",
    );
  }

  return transaction;
};

export const approveBankTransferService =
  async ({
    transactionId,
    adminUserId = null,
    notes = "",
    req = null,
  }) => {
    let transaction =
      await getReviewableBankTransfer(
        transactionId,
      );

    if (
      transaction.status ===
        PAYMENT_TRANSACTION_STATUSES.SUCCESS &&
      transaction.booking
    ) {
      return {
        transaction,
        bookingId: transaction.booking,
        alreadyProcessed: true,
      };
    }

    if (
      [
        PAYMENT_TRANSACTION_STATUSES.CAPTURED,
        PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
      ].includes(transaction.status) &&
      transaction.externalFulfillment?.required
    ) {
      const fulfillment = transaction.externalFulfillment;
      if (
        fulfillment.status ===
        EXTERNAL_FULFILLMENT_STATUSES.FAILED_FINAL
      ) {
        throw new AppError(
          "EXTERNAL_FLIGHT_ORDER_FAILED",
          409,
          "externalFulfillment",
          { providerErrorCode: fulfillment.lastErrorCode || null },
        );
      }
    }

    const isBookingConversionRetry =
      transaction.status ===
      PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING;

    if (!REVIEWABLE_STATUSES.has(transaction.status) && !isBookingConversionRetry) {
      throw new AppError(
        "PAYMENT_APPROVAL_NOT_ALLOWED",
        409,
        "status",
      );
    }

    if (!transaction.draftBooking) {
      throw new AppError(
        "PAYMENT_DRAFT_LINK_MISSING",
        400,
        "draftBooking",
      );
    }

    if (!isBookingConversionRetry) {
      transaction =
        await updatePaymentTransactionStatusService({
        transactionId:
          transaction._id,
        toStatus:
          PAYMENT_TRANSACTION_STATUSES.CAPTURED,
        source:
          PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
        eventCode:
          PAYMENT_TRANSACTION_EVENT_CODES.BANK_TRANSFER_APPROVED,
        message:
          notes ||
          "Bank transfer approved by administrator",
        updatedBy: adminUserId,
        extraUpdates: {
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
          rejectionReason: "",
          notes,
        },
        req,
        auditAction:
          AUDIT_ACTIONS.BANK_TRANSFER_APPROVE,
        failIfAlreadyTransitioned: true,
        });
    }

    if (transaction.externalFulfillment?.required) {
      let fulfillment;
      try {
        fulfillment = await fulfillExternalFlight({ transaction });
      } catch (error) {
        transaction = await recordBookingConversionFailureService({
          transactionId: transaction._id,
          reason: error?.code || error?.message || "External flight order failed",
          source: PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
          updatedBy: adminUserId,
        });
        await sendPaidPendingBookingNotification({ transaction, req });
        throw error;
      }
      transaction = fulfillment.transaction || transaction;
      const externalFulfillment = transaction.externalFulfillment;
      const hasConfirmedProviderOrder =
        fulfillment.confirmed &&
        externalFulfillment?.status ===
          EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED &&
        Boolean(externalFulfillment.providerOrderId) &&
        Boolean(externalFulfillment.orderSnapshot);
      if (!hasConfirmedProviderOrder) {
        transaction = await recordBookingConversionFailureService({
          transactionId: transaction._id,
          reason: "External flight fulfillment is pending provider confirmation",
          source: PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
          updatedBy: adminUserId,
        });
        await sendPaidPendingBookingNotification({ transaction, req });
        return { transaction, booking: null, pendingFulfillment: true };
      }
    }

    let conversionResult;

    try {
      const linkedHold =
        await findInventoryHoldByPaymentTransactionService({
          paymentTransaction: transaction._id,
        });
      const holdForConversion = linkedHold?._id
        ? await getInventoryHoldForCommitService({
            holdId: linkedHold._id,
            draftBooking: transaction.draftBooking,
            paymentTransaction: transaction._id,
          })
        : null;

      conversionResult =
        await convertDraftToBooking({
          draftId:
            transaction.draftBooking,
          userId:
            transaction.user ||
            adminUserId ||
            null,
          req,
          paymentData: {
            paymentMethod:
              transaction.methodCode,
            paidAmount:
              transaction.amount,
            paymentReference:
              transaction.paymentReference,
            currency:
              transaction.currency,
            paymentTransactionId:
              transaction._id,
          },
          inventoryHoldId:
            holdForConversion?._id || null,
          externalFlightOrderSnapshot:
            transaction.externalFulfillment?.orderSnapshot || null,
        });
    } catch (error) {
      transaction = await recordBookingConversionFailureService({
        transactionId:
          transaction._id,
        reason:
          error?.message ||
          "Booking conversion failed after bank transfer approval",
        source:
          PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
        updatedBy: adminUserId,
      });

      await sendPaidPendingBookingNotification({ transaction, req });

      throw error;
    }

    const booking =
      conversionResult?.booking ||
      conversionResult;

    if (!booking?._id) {
      throw new AppError(
        "CONVERSION_BOOKING_INVALID",
        500,
        "booking",
      );
    }

    await attachBookingToPaymentTransactionService({
      transactionId:
        transaction._id,
      bookingId:
        booking._id,
      updatedBy:
        adminUserId,
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
    });

    transaction =
      await updatePaymentTransactionStatusService({
        transactionId:
          transaction._id,
        toStatus:
          PAYMENT_TRANSACTION_STATUSES.SUCCESS,
        source:
          PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
        eventCode:
          PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_SUCCEEDED,
        message:
          "Bank transfer approved and booking created",
        updatedBy:
          adminUserId,
      });

    await sendBankTransferApprovedNotification({
      transaction,
      booking,
      req,
    });

    return {
      transaction,
      booking,
      alreadyProcessed: false,
    };
  };

export const rejectBankTransferService =
  async ({
    transactionId,
    reason,
    adminUserId = null,
    req = null,
  }) => {
    const normalizedReason =
      String(reason || "").trim();

    if (!normalizedReason) {
      throw new AppError(
        "PAYMENT_REJECTION_REASON_REQUIRED",
        400,
        "reason",
      );
    }

    const transaction =
      await getReviewableBankTransfer(
        transactionId,
      );

    const alreadyRejected =
      transaction.status ===
      PAYMENT_TRANSACTION_STATUSES.REJECTED;

    if (
      !REVIEWABLE_STATUSES.has(
        transaction.status,
      ) &&
      !alreadyRejected
    ) {
      throw new AppError(
        "PAYMENT_REJECTION_NOT_ALLOWED",
        409,
        "status",
      );
    }

    const rejectedTransaction = alreadyRejected
      ? transaction
      : await updatePaymentTransactionStatusService({
          transactionId:
            transaction._id,
          toStatus:
            PAYMENT_TRANSACTION_STATUSES.REJECTED,
          source:
            PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
          eventCode:
            PAYMENT_TRANSACTION_EVENT_CODES.BANK_TRANSFER_REJECTED,
          message:
            normalizedReason,
          failureReason:
            normalizedReason,
          updatedBy:
            adminUserId,
          extraUpdates: {
            verifiedBy:
              adminUserId,
            verifiedAt:
              new Date(),
            rejectionReason:
              normalizedReason,
          },
          req,
          auditAction:
            AUDIT_ACTIONS.BANK_TRANSFER_REJECT,
        });

    if (rejectedTransaction.draftBooking) {
      await restoreDraftAfterPaymentRejectionService({
        draftId: rejectedTransaction.draftBooking,
      });
    }

    const linkedHold =
      await findInventoryHoldByPaymentTransactionService({
        paymentTransaction: rejectedTransaction._id,
      });

    if (linkedHold?._id) {
      await releaseInventoryHoldService({
        holdId: linkedHold._id,
        reason: "bank_transfer_rejected",
        req,
      });
    }

    if (!alreadyRejected) {
      await sendBankTransferRejectedNotification({
        transaction: rejectedTransaction,
        req,
      });
    }

    return rejectedTransaction;
  };
