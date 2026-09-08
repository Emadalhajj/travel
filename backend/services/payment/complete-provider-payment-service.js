/*
=====================================================
Complete Provider Payment Service
=====================================================

الخدمة المركزية لإكمال الدفع الإلكتروني بعد رجوع
Callback أو Webhook من مزود الدفع.

المسؤوليات:
-----------------------------------------------------
- العثور على PaymentTransaction.
- التحقق من النتيجة فعليًا لدى المزود.
- منع معالجة العملية أكثر من مرة.
- تحويل المسودة إلى Booking بعد تأكيد الدفع.
- ربط Booking بالمعاملة.
- تحديث الحالة عبر PaymentTransaction Layer فقط.

مهم:
-----------------------------------------------------
لا تثق في status أو amount القادمين من Frontend.
ولا تحفظ Raw Provider Payload.
=====================================================
*/

import AppError from "../../utils/AppError.js";
import { roundPrice } from "../../utils/roundPrice.js";

import {
  convertDraftToBooking,
} from "../draft-bookings/draft-booking-service.js";
import {
  findInventoryHoldByPaymentTransactionService,
  getInventoryHoldForCommitService,
  releaseInventoryHoldService,
} from "../booking/inventory-hold-service.js";

import {
  getPaymentProviderByIdService,
} from "./payment-provider-service.js";

import {
  acquirePaymentBookingConversionLockService,
  findPaymentTransactionService,
  markPaymentTransactionFailedService,
  recordBookingConversionFailureService,
  recordPaymentTransactionEventService,
  releasePaymentBookingConversionLockService,
  updatePaymentTransactionStatusService,
} from "./paymentTransaction-service.js";

import {
  verifyProviderPayment,
} from "./providers/payment-provider-factory.js";

import {
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

import {
  PAYMENT_TRANSACTION_EVENT_CODES,
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";
import {
  sendPaidPendingBookingNotification,
  sendPaymentFailedNotification,
  sendPaymentReceivedNotification,
} from "../notifications/payment-notification-service.js";

const SUCCESS_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.SUCCESS,
  LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
]);

const PAYMENT_CONFIRMED_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.CAPTURED,
  PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
  ...SUCCESS_STATUSES,
]);

const resolveTransactionIdentifier = ({
  transactionId,
  paymentReference,
  providerReference,
  checkoutId,
}) => {
  if (transactionId) {
    return { transactionId };
  }

  if (paymentReference) {
    return { paymentReference };
  }

  if (providerReference) {
    return { providerReference };
  }

  if (checkoutId) {
    return { checkoutId };
  }

  throw new AppError(
    "PAYMENT_TRANSACTION_REQUIRED",
    400,
    "paymentTransaction",
  );
};

const buildProviderConfig = (provider) => ({
  environment: provider.environment,
  baseUrl: provider.baseUrl,
  credentials: provider.credentials || {},
});

const validateVerifiedPayment = ({
  transaction,
  verification,
}) => {
  const verifiedAmount = Number(
    verification.amount,
  );

  if (
    !Number.isFinite(verifiedAmount)
  ) {
    throw new AppError(
      "PROVIDER_AMOUNT_MISSING",
      502,
      "amount",
    );
  }

  if (
    roundPrice(verifiedAmount) !==
      roundPrice(transaction.amount)
  ) {
    throw new AppError(
      "PAYMENT_AMOUNT_MISMATCH",
      409,
      "amount",
    );
  }

  if (!verification.currency) {
    throw new AppError(
      "PROVIDER_CURRENCY_MISSING",
      502,
      "currency",
    );
  }

  if (
    String(verification.currency).toUpperCase() !==
      String(transaction.currency).toUpperCase()
  ) {
    throw new AppError(
      "PAYMENT_CURRENCY_MISMATCH",
      409,
      "currency",
    );
  }

  if (!verification.merchantTransactionId) {
    throw new AppError(
      "PROVIDER_REFERENCE_MISSING",
      502,
      "paymentReference",
    );
  }

  if (
    transaction.paymentReference &&
    verification.merchantTransactionId !==
      transaction.paymentReference
  ) {
    throw new AppError(
      "PAYMENT_REFERENCE_MISMATCH",
      409,
      "paymentReference",
    );
  }
};

const buildSafeResult = ({
  transaction,
  booking = null,
  verificationStatus,
  reused = false,
}) => ({
  transaction: {
    id: transaction._id,
    status: String(
      transaction.status || "",
    ).toUpperCase(),
    paymentReference:
      transaction.paymentReference || "",
    providerReference:
      transaction.providerReference || "",
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethodCode:
      transaction.methodCode,
    providerCode:
      transaction.providerCode,
    bookingId:
      transaction.booking ||
      booking?._id ||
      null,
  },
  booking,
  verificationStatus,
  reused,
});

export const completeProviderPaymentService = async ({
  transactionId,
  paymentReference,
  providerReference,
  checkoutId,
  resourcePath = "",
  req = null,
}) => {
  const identifier =
    resolveTransactionIdentifier({
      transactionId,
      paymentReference,
      providerReference,
      checkoutId,
    });

  let transaction =
    await findPaymentTransactionService({
      ...identifier,
      includeEvents: true,
    });

  const linkedHold =
    await findInventoryHoldByPaymentTransactionService({
      paymentTransaction: transaction._id,
    });

  /*
  تكرار Callback بعد اكتمال العملية يعيد النتيجة
  الحالية ولا ينشئ حجزًا آخر.
  */
  if (
    SUCCESS_STATUSES.has(
      transaction.status,
    ) &&
    transaction.booking
  ) {
    return buildSafeResult({
      transaction,
      booking: transaction.booking,
      verificationStatus: "SUCCESS",
      reused: true,
    });
  }

  if (!transaction.paymentProvider) {
    throw new AppError(
      "PAYMENT_PROVIDER_LINK_MISSING",
      400,
      "providerId",
    );
  }

  const provider =
    await getPaymentProviderByIdService({
      providerId:
        transaction.paymentProvider,
      exposeCredentials: true,
    });

  const verification =
    await verifyProviderPayment({
      providerCode:
        transaction.providerCode ||
        provider.code,
      checkoutId:
        transaction.checkoutId,
      resourcePath,
      providerConfig:
        buildProviderConfig(provider),
    });

  validateVerifiedPayment({
    transaction,
    verification,
  });

  if (
    verification.verificationStatus ===
    "PENDING"
  ) {
    return buildSafeResult({
      transaction,
      verificationStatus: "PENDING",
    });
  }

  if (
    verification.verificationStatus !==
    "SUCCESS"
  ) {
    transaction =
      await markPaymentTransactionFailedService({
        transactionId:
          transaction._id,
        reason:
          verification.resultDescription ||
          "Provider payment verification failed",
        source:
          PAYMENT_TRANSACTION_EVENT_SOURCES.PROVIDER,
        providerReference:
          verification.providerReference,
      });

    await sendPaymentFailedNotification({ transaction, req });

    if (linkedHold?._id) {
      try {
        await releaseInventoryHoldService({
          holdId: linkedHold._id,
          reason: "Provider payment verification failed",
          req,
        });
      } catch (releaseError) {
        console.error("Inventory hold release failed:", releaseError);
      }
    }

    return buildSafeResult({
      transaction,
      verificationStatus: "FAILED",
    });
  }

  /*
  نجاح PA يعني أن المبلغ مفوض فقط، وليس محصلًا.
  لا ننشئ الحجز قبل نجاح CP.
  */
  if (
    String(verification.paymentType || "").toUpperCase() === "PA"
  ) {
    if (
      transaction.status !== PAYMENT_TRANSACTION_STATUSES.AUTHORIZED
    ) {
      transaction = await updatePaymentTransactionStatusService({
        transactionId: transaction._id,
        toStatus: PAYMENT_TRANSACTION_STATUSES.AUTHORIZED,
        source: PAYMENT_TRANSACTION_EVENT_SOURCES.PROVIDER,
        eventCode: PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_AUTHORIZED,
        message:
          verification.resultDescription || "Provider payment authorized",
        providerReference: verification.providerReference,
        req,
      });
    }

    return buildSafeResult({
      transaction,
      verificationStatus: "AUTHORIZED",
    });
  }

  if (
    !PAYMENT_CONFIRMED_STATUSES.has(
      transaction.status,
    )
  ) {
    transaction =
      await updatePaymentTransactionStatusService({
        transactionId:
          transaction._id,
        toStatus:
          PAYMENT_TRANSACTION_STATUSES.CAPTURED,
        source:
          PAYMENT_TRANSACTION_EVENT_SOURCES.PROVIDER,
        eventCode:
          PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_CAPTURED,
        message:
          verification.resultDescription ||
          "Provider payment captured",
        providerReference:
          verification.providerReference,
        req,
      });
  }

  const conversionLock =
    await acquirePaymentBookingConversionLockService({
      transactionId: transaction._id,
    });

  if (!conversionLock) {
    const currentTransaction =
      await findPaymentTransactionService({
        transactionId: transaction._id,
      });

    if (
      SUCCESS_STATUSES.has(currentTransaction.status) &&
      currentTransaction.booking
    ) {
      return buildSafeResult({
        transaction: currentTransaction,
        booking: currentTransaction.booking,
        verificationStatus: "SUCCESS",
        reused: true,
      });
    }

    return buildSafeResult({
      transaction: currentTransaction,
      verificationStatus: "PROCESSING",
      reused: true,
    });
  }

  await recordPaymentTransactionEventService({
    transactionId: transaction._id,
    fromStatus: transaction.status,
    toStatus: transaction.status,
    source:
      PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
    eventCode:
      PAYMENT_TRANSACTION_EVENT_CODES.BOOKING_CONVERSION_STARTED,
    message:
      "Draft booking conversion started",
    providerReference:
      transaction.providerReference,
  });

  let conversionResult;

  try {
    const holdForConversion = linkedHold?._id
      ? await getInventoryHoldForCommitService({
          holdId: linkedHold._id,
          draftBooking: transaction.draftBooking,
          paymentTransaction: transaction._id,
          allowExpired: true,
        })
      : null;

    conversionResult =
      await convertDraftToBooking({
        draftId:
          transaction.draftBooking,
        userId:
          transaction.user || null,
        req,
        paymentData: {
          paymentMethod:
            transaction.methodCode,
          paidAmount:
            transaction.amount,
          transactionId:
            verification.providerReference ||
            transaction.providerReference,
          paymentReference:
            transaction.paymentReference,
          gateway:
            transaction.providerCode,
          currency:
            transaction.currency,
          paymentTransactionId:
            transaction._id,
        },
        inventoryHoldId:
          holdForConversion?._id || null,
        allowExpiredInventoryHold: true,
      });
  } catch (error) {
    await releasePaymentBookingConversionLockService({
      transactionId: transaction._id,
    });

    transaction = await recordBookingConversionFailureService({
      transactionId:
        transaction._id,
      reason:
        error?.message ||
        "Booking conversion failed",
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
    });

    await sendPaidPendingBookingNotification({ transaction, req });

    throw error;
  }

  const booking =
    conversionResult?.booking ||
    conversionResult;

  if (!booking?._id) {
    await releasePaymentBookingConversionLockService({
      transactionId: transaction._id,
    });

    transaction = await recordBookingConversionFailureService({
      transactionId:
        transaction._id,
      reason:
        "Booking conversion returned no booking",
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
    });

    await sendPaidPendingBookingNotification({ transaction, req });

    throw new AppError(
      "BOOKING_NOT_CREATED_AFTER_PAYMENT",
      500,
      "booking",
    );
  }

  transaction =
    await updatePaymentTransactionStatusService({
      transactionId:
        transaction._id,
      toStatus:
        PAYMENT_TRANSACTION_STATUSES.SUCCESS,
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
      eventCode:
        PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_SUCCEEDED,
      message:
        "Payment completed and booking created",
      providerReference:
        verification.providerReference,
      extraUpdates: {
        booking: booking._id,
      },
    });

  await sendPaymentReceivedNotification({
    transaction,
    booking,
    req,
  });

  await releasePaymentBookingConversionLockService({
    transactionId: transaction._id,
  });

  return buildSafeResult({
    transaction,
    booking,
    verificationStatus: "SUCCESS",
    reused:
      Boolean(conversionResult?.reused),
  });
};
