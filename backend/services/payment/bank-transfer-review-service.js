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
      "المعاملة ليست تحويلًا بنكيًا",
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
      !REVIEWABLE_STATUSES.has(
        transaction.status,
      )
    ) {
      throw new AppError(
        "المعاملة لا تقبل الاعتماد في حالتها الحالية",
        409,
        "status",
      );
    }

    if (!transaction.draftBooking) {
      throw new AppError(
        "المعاملة غير مرتبطة بمسودة حجز",
        400,
        "draftBooking",
      );
    }

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
      });

    let conversionResult;

    try {
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
        "لم ينتج عن التحويل حجز صالح",
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
        "سبب الرفض مطلوب",
        400,
        "reason",
      );
    }

    const transaction =
      await getReviewableBankTransfer(
        transactionId,
      );

    if (
      !REVIEWABLE_STATUSES.has(
        transaction.status,
      )
    ) {
      throw new AppError(
        "المعاملة لا تقبل الرفض في حالتها الحالية",
        409,
        "status",
      );
    }

    const rejectedTransaction = await updatePaymentTransactionStatusService({
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

    await sendBankTransferRejectedNotification({
      transaction: rejectedTransaction,
      req,
    });

    return rejectedTransaction;
  };
