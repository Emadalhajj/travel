/*
=====================================================
Payment Transaction Service
=====================================================

الطبقة المركزية المشتركة لجميع طرق الدفع.

المسؤوليات:
-----------------------------------------------------
- إنشاء المعاملة ومنع التكرار.
- البحث بالمراجع المختلفة.
- التحقق من انتقالات الحالة.
- تسجيل Timeline داخلي.
- إرفاق نتيجة Checkout المنقحة.
- تحديث ملخص الدفع داخل Booking.

مهم:
-----------------------------------------------------
لا يتصل هذا الملف بأي Provider Adapter.
ولا يحفظ Raw Gateway Payload أو Credentials.
=====================================================
*/

import mongoose from "mongoose";

import Booking from "../../models/booking/booking-model.js";
import PaymentMethod from "../../models/payments/payment-method-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";

import AppError from "../../utils/AppError.js";
import { roundPrice } from "../../utils/roundPrice.js";

import {
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
  REUSABLE_PAYMENT_TRANSACTION_STATUSES,
  SETTLED_PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

import {
  PAYMENT_TRANSACTION_EVENT_CODES,
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";
import { PAYMENT_TRANSACTION_STATUS_TRANSITIONS } from "../../constants/payments/payment-transaction-transitions.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { recordPaymentTransactionAuditService } from "../audit/payment-transaction-audit-service.js";

const BLOCKING_PUBLIC_PAYMENT_STATUSES = Object.freeze([
  ...REUSABLE_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES.AUTHORIZED,
  PAYMENT_TRANSACTION_STATUSES.CAPTURED,
  PAYMENT_TRANSACTION_STATUSES.SUCCESS,
  PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
  LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
]);

const TERMINAL_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.SUCCESS,
  PAYMENT_TRANSACTION_STATUSES.FAILED,
  PAYMENT_TRANSACTION_STATUSES.REJECTED,
  PAYMENT_TRANSACTION_STATUSES.CANCELED,
  PAYMENT_TRANSACTION_STATUSES.EXPIRED,
  PAYMENT_TRANSACTION_STATUSES.REFUNDED,
]);

/*
=====================================================
Find Blocking Public Payment For Draft
=====================================================

يمنع بدء معاملة جديدة لمسودة لديها دفع قائم أو مدفوع،
حتى عند تغيير PaymentConfiguration أو طريقة الدفع.
=====================================================
*/

export const findBlockingPublicPaymentForDraftService = async ({
  draftBookingId,
}) => {
  if (!mongoose.Types.ObjectId.isValid(draftBookingId)) {
    throw new AppError("المعرف المرسل غير صالح", 400, "draftId");
  }

  return PaymentTransaction.findOne({
    draftBooking: draftBookingId,
    status: { $in: BLOCKING_PUBLIC_PAYMENT_STATUSES },
    isDeleted: { $ne: true },
  })
    .select("status methodCode providerCode booking updatedAt")
    .sort({ updatedAt: -1 });
};

export const findPublicPaymentReviewTransactionsService = async ({
  userId,
  draftBookingIds = [],
}) => {
  const validUserId = mongoose.Types.ObjectId.isValid(userId)
    ? userId
    : null;

  const validDraftBookingIds = draftBookingIds.filter((draftId) =>
    mongoose.Types.ObjectId.isValid(draftId),
  );

  if (!validUserId && !validDraftBookingIds.length) return [];

  const ownershipFilter = [];

  if (validUserId) {
    ownershipFilter.push({ user: validUserId });
  }

  if (validDraftBookingIds.length) {
    ownershipFilter.push({
      draftBooking: { $in: validDraftBookingIds },
    });
  }

  return PaymentTransaction.find({
    $or: ownershipFilter,
    status: {
      $in: [
        PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
        PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
      ],
    },
    draftBooking: { $ne: null },
    isDeleted: { $ne: true },
  })
    .select("draftBooking status methodCode paymentReference updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
};

/*
=====================================================
Validation
=====================================================
*/

const validateObjectId = (value, field) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError("المعرف المرسل غير صالح", 400, field);
  }
};

const normalizeCode = (value = "") => String(value).trim().toUpperCase();
const normalizeCurrency = (value = "SAR") => normalizeCode(value || "SAR");

const validateAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("مبلغ الدفع غير صحيح", 400, "amount");
  }

  return roundPrice(amount);
};

const ensurePaymentTarget = ({ draftBooking, booking }) => {
  if (!draftBooking && !booking) {
    throw new AppError(
      "يجب ربط معاملة الدفع بمسودة أو حجز",
      400,
      "paymentTransaction",
    );
  }
};

/*
=====================================================
Idempotency
=====================================================
*/

const buildIdempotencyKey = ({
  draftBooking,
  booking,
  paymentConfigurationId,
  methodCode,
  customKey,
}) => {
  if (customKey) {
    return String(customKey).trim();
  }

  if (!paymentConfigurationId || (!draftBooking && !booking)) {
    return undefined;
  }

  const target = draftBooking
    ? `draft:${draftBooking}`
    : `booking:${booking}`;

  return [target, paymentConfigurationId, methodCode].join(":");
};

export const findReusablePaymentTransactionService = async ({
  draftBooking,
  booking,
  paymentConfigurationId,
  methodCode,
  idempotencyKey,
}) => {
  const reusableKey = buildIdempotencyKey({
    draftBooking,
    booking,
    paymentConfigurationId,
    methodCode,
    customKey: idempotencyKey,
  });

  const filter = {
    isDeleted: false,
    status: { $in: REUSABLE_PAYMENT_TRANSACTION_STATUSES },
  };

  if (reusableKey) {
    filter.idempotencyKey = reusableKey;
  } else {
    if (draftBooking) filter.draftBooking = draftBooking;
    if (booking) filter.booking = booking;
    if (paymentConfigurationId) {
      filter.paymentConfigurationId = paymentConfigurationId;
    }
    if (methodCode) filter.methodCode = normalizeCode(methodCode);
  }

  return PaymentTransaction.findOne(filter)
    .select("+events")
    .sort({ createdAt: -1 });
};

/*
=====================================================
Event History
=====================================================
*/

export const recordPaymentTransactionEventService = async ({
  transaction,
  transactionId,
  fromStatus = null,
  toStatus = null,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  eventCode = PAYMENT_TRANSACTION_EVENT_CODES.STATUS_CHANGED,
  message = "",
  providerReference = "",
  createdBy = null,
  save = true,
}) => {
  const target =
    transaction ||
    (await PaymentTransaction.findOne({
      _id: transactionId,
      isDeleted: false,
    }).select("+events"));

  if (!target) {
    throw new AppError("معاملة الدفع غير موجودة", 404, "transactionId");
  }

  target.events.push({
    fromStatus,
    toStatus,
    source,
    eventCode,
    message: String(message || "").trim(),
    providerReference: String(providerReference || "").trim(),
    createdBy: createdBy || null,
  });

  if (save) {
    await target.save();
  }

  return target;
};

/*
=====================================================
Create Transaction
=====================================================
*/

export const createPaymentTransactionService = async ({
  draftBooking = null,
  booking = null,
  user = null,
  paymentConfigurationId = null,
  paymentMethodId = null,
  paymentMethodCode,
  providerId = null,
  bankAccountId = null,
  bankAccountSnapshot = {},
  providerCode = "",
  providerEnvironment = "",
  amount,
  currency = "SAR",
  status = PAYMENT_TRANSACTION_STATUSES.INITIATED,
  paymentReference = "",
  metadata = {},
  createdBy = null,
  idempotencyKey,
  reuseExisting = true,
  eventSource = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  req = null,
}) => {
  ensurePaymentTarget({ draftBooking, booking });

  const normalizedMethodCode = normalizeCode(paymentMethodCode);
  const normalizedAmount = validateAmount(amount);
  const normalizedCurrency = normalizeCurrency(currency);

  if (!normalizedMethodCode) {
    throw new AppError("طريقة الدفع غير محددة", 400, "paymentMethodCode");
  }

  const paymentMethod = paymentMethodId
    ? await PaymentMethod.findOne({
        _id: paymentMethodId,
        code: normalizedMethodCode,
        isDeleted: false,
      })
    : await PaymentMethod.findOne({
        code: normalizedMethodCode,
        isActive: true,
        isDeleted: false,
      });

  if (!paymentMethod) {
    throw new AppError(
      "طريقة الدفع غير موجودة أو غير مفعلة",
      400,
      "paymentMethodCode",
    );
  }

  const reusableKey = buildIdempotencyKey({
    draftBooking,
    booking,
    paymentConfigurationId,
    methodCode: normalizedMethodCode,
    customKey: idempotencyKey,
  });

  if (reuseExisting) {
    const existing = await findReusablePaymentTransactionService({
      draftBooking,
      booking,
      paymentConfigurationId,
      methodCode: normalizedMethodCode,
      idempotencyKey: reusableKey,
    });

    if (existing) {
      /*
      إعدادات BANK_TRANSFER القديمة كانت تُنشئ المعاملة كدفع يدوي
      بحالة pending_approval وبدون حساب بنكي. بعد تصحيح الإعداد إلى
      BANK_ACCOUNT يجب تجهيز نفس المعاملة بدل إرجاعها بحالة لا تقبل
      رفع الإثبات، حفاظًا على Idempotency وعدم إنشاء معاملة مكررة.
      */
      const shouldRepairLegacyBankTransfer =
        normalizedMethodCode === "BANK_TRANSFER" &&
        status === PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF &&
        existing.status === PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL &&
        bankAccountId;

      if (shouldRepairLegacyBankTransfer) {
        const fromStatus = existing.status;

        existing.status = PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF;
        existing.bankAccount = bankAccountId;
        existing.bankAccountSnapshot =
          bankAccountSnapshot && typeof bankAccountSnapshot === "object"
            ? bankAccountSnapshot
            : {};
        existing.updatedBy = createdBy || existing.updatedBy || null;

        await recordPaymentTransactionEventService({
          transaction: existing,
          fromStatus,
          toStatus: PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF,
          source: eventSource,
          eventCode: PAYMENT_TRANSACTION_EVENT_CODES.STATUS_CHANGED,
          message:
            "Legacy bank transfer transaction prepared for proof submission",
          createdBy,
          save: false,
        });

        await existing.save();
      }

      return existing;
    }
  }

  const transactionData = {
    draftBooking,
    booking,
    user,
    paymentMethod: paymentMethod._id,
    paymentConfigurationId,
    methodCode: paymentMethod.code,
    methodNameAr: paymentMethod.nameAr,
    methodNameEn: paymentMethod.nameEn,
    paymentProvider: providerId,
    bankAccount: bankAccountId,
    bankAccountSnapshot:
      bankAccountSnapshot && typeof bankAccountSnapshot === "object"
        ? bankAccountSnapshot
        : {},
    providerCode: normalizeCode(providerCode),
    providerEnvironment: String(providerEnvironment || "").trim(),
    amount: normalizedAmount,
    currency: normalizedCurrency,
    status,
    paymentReference: String(paymentReference || "").trim(),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
    idempotencyKey: reusableKey,
    createdBy,
    updatedBy: createdBy,
    events: [
      {
        fromStatus: null,
        toStatus: status,
        source: eventSource,
        eventCode: PAYMENT_TRANSACTION_EVENT_CODES.TRANSACTION_CREATED,
        message: "Payment transaction created",
        createdBy,
      },
    ],
  };

  try {
    const transaction = await PaymentTransaction.create(transactionData);
    await recordPaymentTransactionAuditService({
      req,
      action: AUDIT_ACTIONS.CREATE,
      transaction,
    });
    return transaction;
  } catch (error) {
    if (error?.code === 11000 && reusableKey) {
      const existing = await findReusablePaymentTransactionService({
        idempotencyKey: reusableKey,
      });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
};

/*
=====================================================
Find Transaction
=====================================================
*/

export const findPaymentTransactionService = async ({
  transactionId,
  paymentReference,
  providerReference,
  checkoutId,
  includeEvents = false,
  includeMetadata = false,
  includeRedirectUrl = false,
}) => {
  const identifiers = [
    transactionId,
    paymentReference,
    providerReference,
    checkoutId,
  ].filter(Boolean);

  if (identifiers.length !== 1) {
    throw new AppError(
      "يجب إرسال معرف بحث واحد فقط",
      400,
      "paymentTransaction",
    );
  }

  const filter = { isDeleted: false };

  if (transactionId) {
    validateObjectId(transactionId, "transactionId");
    filter._id = transactionId;
  }

  if (paymentReference) filter.paymentReference = paymentReference;
  if (providerReference) filter.providerReference = providerReference;
  if (checkoutId) filter.checkoutId = checkoutId;

  let query = PaymentTransaction.findOne(filter);

  if (includeEvents) query = query.select("+events");
  if (includeMetadata) query = query.select("+metadata");
  if (includeRedirectUrl) query = query.select("+redirectUrl");

  const transaction = await query;

  if (!transaction) {
    throw new AppError("معاملة الدفع غير موجودة", 404, "transactionId");
  }

  return transaction;
};

/*
=====================================================
Status Transition
=====================================================
*/

const validateStatusTransition = ({ fromStatus, toStatus }) => {
  if (fromStatus === toStatus) {
    return false;
  }

  const allowedStatuses =
    PAYMENT_TRANSACTION_STATUS_TRANSITIONS[fromStatus] || [];

  if (!allowedStatuses.includes(toStatus)) {
    throw new AppError(
      `لا يمكن تغيير حالة المعاملة من ${fromStatus} إلى ${toStatus}`,
      409,
      "status",
    );
  }

  return true;
};

export const updatePaymentTransactionStatusService = async ({
  transactionId,
  toStatus,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  eventCode = PAYMENT_TRANSACTION_EVENT_CODES.STATUS_CHANGED,
  message = "",
  providerReference,
  failureReason,
  updatedBy = null,
  extraUpdates = {},
  req = null,
  auditAction = AUDIT_ACTIONS.PAYMENT_STATUS_CHANGE,
  providerResult = null,
}) => {
  validateObjectId(transactionId, "transactionId");

  const transaction = await PaymentTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
  }).select("+events +metadata");

  if (!transaction) {
    throw new AppError("معاملة الدفع غير موجودة", 404, "transactionId");
  }

  const fromStatus = transaction.status;
  const before = transaction.toObject();
  const changed = validateStatusTransition({ fromStatus, toStatus });

  if (!changed) {
    return transaction;
  }

  const setUpdates = {
    status: toStatus,
    updatedBy: updatedBy || null,
  };

  const effectiveProviderReference =
    providerReference !== undefined
      ? String(providerReference || "").trim()
      : transaction.providerReference;

  if (providerReference !== undefined) {
    setUpdates.providerReference = effectiveProviderReference;
  }

  if (failureReason !== undefined) {
    setUpdates.failureReason = String(failureReason || "").trim();
  }

  const allowedExtraFields = [
    "booking",
    "verifiedBy",
    "verifiedAt",
    "rejectionReason",
    "transferReference",
    "transferDate",
    "expiresAt",
    "notes",
  ];

  allowedExtraFields.forEach((field) => {
    if (extraUpdates[field] !== undefined) {
      setUpdates[field] = extraUpdates[field];
    }
  });

  /*
  تحديث الحالة والـTimeline في عملية ذرية واحدة.

  شرط status يمنع Webhooks المتزامنة من تسجيل الانتقال
  نفسه مرتين بعد أن تقرأ كلتاهما الحالة القديمة.
  */
  const atomicUpdate = {
    $set: setUpdates,
    $push: {
      events: {
        fromStatus,
        toStatus,
        source,
        eventCode,
        message: String(message || "").trim(),
        providerReference: String(
          effectiveProviderReference || "",
        ).trim(),
        createdBy: updatedBy || null,
      },
    },
  };

  if (TERMINAL_STATUSES.has(toStatus)) {
    atomicUpdate.$unset = {
      idempotencyKey: 1,
    };
  }

  const updatedTransaction =
    await PaymentTransaction.findOneAndUpdate(
      {
        _id: transactionId,
        isDeleted: false,
        status: fromStatus,
      },
      atomicUpdate,
      {
        new: true,
        runValidators: true,
      },
    ).select("+events +metadata");

  if (!updatedTransaction) {
    const currentTransaction =
      await PaymentTransaction.findOne({
        _id: transactionId,
        isDeleted: false,
      }).select("+events +metadata");

    if (
      currentTransaction?.status ===
      toStatus
    ) {
      return currentTransaction;
    }

    throw new AppError(
      "تغيرت حالة معاملة الدفع أثناء تنفيذ العملية؛ يرجى إعادة المحاولة",
      409,
      "status",
    );
  }

  await recordPaymentTransactionAuditService({
    req,
    action: auditAction,
    transaction: updatedTransaction,
    before,
    providerResult,
  });

  if (updatedTransaction.booking) {
    await applyPaymentSummaryToBooking({
      bookingId: updatedTransaction.booking,
    });
  }

  return updatedTransaction;
};

/*
=====================================================
Booking Conversion Lock
=====================================================

قفل ذري قصير يمنع Webhook وطلب Capture متزامنين من
تحويل المسودة نفسها إلى حجز مرتين. يُعد القفل منتهيًا
بعد خمس دقائق للتعافي من توقف العملية.
=====================================================
*/

export const acquirePaymentBookingConversionLockService = async ({
  transactionId,
}) => {
  validateObjectId(transactionId, "transactionId");

  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);

  return PaymentTransaction.findOneAndUpdate(
    {
      _id: transactionId,
      isDeleted: false,
      booking: null,
      $or: [
        { "metadata.bookingConversionInProgress": { $ne: true } },
        { "metadata.bookingConversionLockedAt": { $lte: staleBefore } },
      ],
    },
    {
      $set: {
        "metadata.bookingConversionInProgress": true,
        "metadata.bookingConversionLockedAt": new Date(),
      },
    },
    { new: true },
  ).select("+metadata +events");
};

export const releasePaymentBookingConversionLockService = async ({
  transactionId,
}) => {
  validateObjectId(transactionId, "transactionId");

  await PaymentTransaction.updateOne(
    { _id: transactionId },
    {
      $unset: {
        "metadata.bookingConversionInProgress": 1,
        "metadata.bookingConversionLockedAt": 1,
      },
    },
  );
};

/*
=====================================================
Attach Provider Checkout
=====================================================
*/

export const attachProviderCheckoutService = async ({
  transactionId,
  checkoutId,
  providerReference = "",
  redirectUrl = "",
  expiresAt = null,
  metadata = {},
  updatedBy = null,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.PROVIDER,
}) => {
  validateObjectId(transactionId, "transactionId");

  const transaction = await PaymentTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
  }).select("+events +metadata +redirectUrl");

  if (!transaction) {
    throw new AppError("معاملة الدفع غير موجودة", 404, "transactionId");
  }

  if (checkoutId) transaction.checkoutId = String(checkoutId).trim();
  if (providerReference) {
    transaction.providerReference = String(providerReference).trim();
  }
  if (redirectUrl) transaction.redirectUrl = String(redirectUrl).trim();
  if (expiresAt) transaction.expiresAt = expiresAt;

  transaction.metadata = {
    ...(transaction.metadata || {}),
    ...(metadata && typeof metadata === "object" ? metadata : {}),
  };
  transaction.updatedBy = updatedBy || null;

  await recordPaymentTransactionEventService({
    transaction,
    fromStatus: transaction.status,
    toStatus: transaction.status,
    source,
    eventCode: PAYMENT_TRANSACTION_EVENT_CODES.CHECKOUT_CREATED,
    message: "Provider checkout created",
    providerReference: transaction.providerReference,
    createdBy: updatedBy,
    save: false,
  });

  await transaction.save();

  return transaction;
};

/*
=====================================================
Mark Failed
=====================================================
*/

export const markPaymentTransactionFailedService = async ({
  transactionId,
  reason,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  providerReference = "",
  updatedBy = null,
}) =>
  updatePaymentTransactionStatusService({
    transactionId,
    toStatus: PAYMENT_TRANSACTION_STATUSES.FAILED,
    source,
    eventCode: PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_FAILED,
    message: String(reason || "Payment transaction failed"),
    failureReason: reason,
    providerReference,
    updatedBy,
  });

/*
=====================================================
Booking Payment Summary
=====================================================
*/

export const calculateBookingPaymentSummary = async ({ booking }) => {
  const transactions = await PaymentTransaction.find({
    booking: booking._id,
    status: { $in: SETTLED_PAYMENT_TRANSACTION_STATUSES },
    isDeleted: false,
  }).lean();

  const paidAmount = transactions.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  const totalPrice = Number(booking.pricing?.totalPrice) || 0;
  const remainingAmount = Math.max(0, roundPrice(totalPrice - paidAmount));

  let paymentStatus = "pending";

  if (paidAmount >= totalPrice && totalPrice > 0) {
    paymentStatus = "paid";
  } else if (paidAmount > 0) {
    paymentStatus = "partial";
  }

  return {
    paidAmount: roundPrice(paidAmount),
    remainingAmount,
    paymentStatus,
  };
};

export const applyPaymentSummaryToBooking = async ({ bookingId, booking }) => {
  const targetBooking = booking || (await Booking.findById(bookingId));

  if (!targetBooking) {
    throw new AppError("الحجز غير موجود", 404, "booking");
  }

  const summary = await calculateBookingPaymentSummary({
    booking: targetBooking,
  });

  targetBooking.paidAmount = summary.paidAmount;
  targetBooking.remainingAmount = summary.remainingAmount;
  targetBooking.paymentStatus = summary.paymentStatus;

  if (summary.paymentStatus === "paid") {
    targetBooking.bookingStatus = "confirmed";
    targetBooking.confirmedAt = targetBooking.confirmedAt || new Date();
  } else if (summary.paymentStatus === "partial") {
    targetBooking.bookingStatus = "pending";
  }

  await targetBooking.save();

  return targetBooking;
};

/*
=====================================================
Public Transaction Status
=====================================================

يعيد البيانات الآمنة فقط لصفحة العميل.
لا يعيد Metadata أو Timeline أو Checkout URL أو Raw Payload.
=====================================================
*/

const normalizePublicTransactionStatus = (
  status,
) =>
  String(
    status || "",
  ).toUpperCase();

export const getPublicPaymentTransactionStatusService = async ({
  transactionId,
}) => {
  validateObjectId(transactionId, "transactionId");

  const transaction = await PaymentTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
  })
    .select(
      [
        "status",
        "methodCode",
        "providerCode",
        "amount",
        "currency",
        "booking",
        "failureReason",
        "updatedAt",
      ].join(" "),
    )
    .lean();

  if (!transaction) {
    throw new AppError(
      "معاملة الدفع غير موجودة",
      404,
      "transactionId",
    );
  }

  return {
    transactionId: transaction._id,
    status:
      normalizePublicTransactionStatus(
        transaction.status,
      ),
    paymentMethodCode: transaction.methodCode,
    providerCode: transaction.providerCode || "",
    amount: transaction.amount,
    currency: transaction.currency,
    bookingId: transaction.booking || null,
    failureMessage: transaction.failureReason || "",
    updatedAt: transaction.updatedAt,
  };
};

/*
=====================================================
Attach Booking To Payment Transaction
=====================================================

يربط الحجز النهائي بالمعاملة بعد نجاح تحويل المسودة.
هذه هي الدالة الوحيدة التي يجب استخدامها لربط Booking
بـPaymentTransaction من خارج هذه الخدمة.
=====================================================
*/

export const attachBookingToPaymentTransactionService = async ({
  transactionId,
  bookingId,
  updatedBy = null,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  message = "Booking attached to payment transaction",
}) => {
  validateObjectId(transactionId, "transactionId");
  validateObjectId(bookingId, "bookingId");

  const transaction = await PaymentTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
  }).select("+events");

  if (!transaction) {
    throw new AppError(
      "معاملة الدفع غير موجودة",
      404,
      "transactionId",
    );
  }

  if (
    transaction.booking &&
    String(transaction.booking) !== String(bookingId)
  ) {
    throw new AppError(
      "معاملة الدفع مرتبطة بحجز آخر",
      409,
      "bookingId",
    );
  }

  if (transaction.booking) {
    return transaction;
  }

  transaction.booking = bookingId;
  transaction.updatedBy = updatedBy || null;

  await recordPaymentTransactionEventService({
    transaction,
    fromStatus: transaction.status,
    toStatus: transaction.status,
    source,
    eventCode: PAYMENT_TRANSACTION_EVENT_CODES.BOOKING_ATTACHED,
    message,
    providerReference: transaction.providerReference,
    createdBy: updatedBy,
    save: false,
  });

  await transaction.save();

  return transaction;
};

/*
=====================================================
Detach Booking From Payment Transaction
=====================================================

تستخدم فقط ضمن Rollback إذا فشل إنشاء الحجز بعد ربطه
بالمعاملة. لا تحذف المعاملة المالية.
=====================================================
*/

export const detachBookingFromPaymentTransactionService = async ({
  transactionId,
  bookingId = null,
  updatedBy = null,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  message = "Booking detached during rollback",
}) => {
  validateObjectId(transactionId, "transactionId");

  const transaction = await PaymentTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
  }).select("+events");

  if (!transaction) {
    throw new AppError(
      "معاملة الدفع غير موجودة",
      404,
      "transactionId",
    );
  }

  if (!transaction.booking) {
    return transaction;
  }

  if (
    bookingId &&
    String(transaction.booking) !== String(bookingId)
  ) {
    return transaction;
  }

  transaction.booking = null;
  transaction.updatedBy = updatedBy || null;

  await recordPaymentTransactionEventService({
    transaction,
    fromStatus: transaction.status,
    toStatus: transaction.status,
    source,
    eventCode: PAYMENT_TRANSACTION_EVENT_CODES.BOOKING_DETACHED,
    message,
    providerReference: transaction.providerReference,
    createdBy: updatedBy,
    save: false,
  });

  await transaction.save();

  return transaction;
};

/*
=====================================================
Record Booking Conversion Failure
=====================================================

فشل إنشاء الحجز لا يعني أن الدفع فشل.
إذا كانت العملية Captured نحولها إلى
paid_pending_booking ونحتفظ بسبب الفشل المنظف.
=====================================================
*/

export const recordBookingConversionFailureService = async ({
  transactionId,
  reason,
  updatedBy = null,
  source = PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
}) => {
  validateObjectId(transactionId, "transactionId");

  const transaction = await findPaymentTransactionService({
    transactionId,
    includeEvents: true,
  });

  const safeReason = String(
    reason || "Booking conversion failed",
  ).trim();

  if (
    transaction.status ===
    PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING
  ) {
    return transaction;
  }

  return updatePaymentTransactionStatusService({
    transactionId,
    toStatus:
      PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
    source,
    eventCode:
      PAYMENT_TRANSACTION_EVENT_CODES.BOOKING_CONVERSION_FAILED,
    message: safeReason,
    updatedBy,
    extraUpdates: {
      notes: safeReason,
    },
  });
};


/*
=====================================================
Attach Bank Transfer Proof
=====================================================

يحفظ إثبات التحويل داخل الطبقة المركزية فقط، ثم
ينقل المعاملة إلى pending_verification ويسجل الحدث.
=====================================================
*/

export const attachBankTransferProofService = async ({
  transactionId,
  transferReference = "",
  proofAttachments = [],
  submittedBy = null,
}) => {
  validateObjectId(transactionId, "transactionId");

  const transaction = await PaymentTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
    status: {
      $in: [
        PAYMENT_TRANSACTION_STATUSES.PENDING,
        PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF,
        PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
      ],
    },
  })
    .select("+events")
    .populate({
      path: "paymentConfigurationId",
      select:
        "configurationType requiresAttachment requiresReference isActive isDeleted",
    });

  if (!transaction) {
    throw new AppError(
      "عملية الدفع غير موجودة أو لا تقبل إرسال إثبات",
      404,
      "transactionId",
    );
  }

  const configuration = transaction.paymentConfigurationId;

  if (
    !configuration ||
    configuration.configurationType !== "BANK_ACCOUNT"
  ) {
    throw new AppError(
      "عملية الدفع ليست تحويلًا بنكيًا",
      400,
      "transactionId",
    );
  }

  const normalizedReference = String(
    transferReference || "",
  ).trim();

  if (
    configuration.requiresReference &&
    !normalizedReference
  ) {
    const error = new AppError(
      "الرقم المرجعي للحوالة مطلوب",
      400,
      "transferReference",
    );

    error.errors = {
      transferReference:
        "الرقم المرجعي للحوالة مطلوب",
    };

    throw error;
  }

  const attachments = Array.isArray(
    proofAttachments,
  )
    ? proofAttachments
    : [];

  if (
    configuration.requiresAttachment &&
    attachments.length === 0
  ) {
    const error = new AppError(
      "إيصال التحويل مطلوب",
      400,
      "proofAttachments",
    );

    error.errors = {
      proofAttachments:
        "يرجى إرفاق إيصال التحويل",
    };

    throw error;
  }

  const submittedAt = new Date();
  const fromStatus = transaction.status;

  transaction.transferReference =
    normalizedReference;
  transaction.proofAttachments =
    attachments;
  transaction.transferDate = submittedAt;
  transaction.rejectionReason = "";
  transaction.updatedBy = submittedBy || null;

  if (
    transaction.status !==
    PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION
  ) {
    validateStatusTransition({
      fromStatus,
      toStatus:
        PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
    });

    transaction.status =
      PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION;
  }

  await recordPaymentTransactionEventService({
    transaction,
    fromStatus,
    toStatus:
      PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
    source:
      PAYMENT_TRANSACTION_EVENT_SOURCES.PUBLIC_API,
    eventCode:
      PAYMENT_TRANSACTION_EVENT_CODES.BANK_TRANSFER_SUBMITTED,
    message:
      "Bank transfer proof submitted for review",
    createdBy: submittedBy,
    save: false,
  });

  await transaction.save();

  return transaction;
};
