/*
=====================================================
Payment Transaction Admin Service
=====================================================

خدمات الإدارة الخاصة بمعاملات الدفع.

المسؤوليات:
-----------------------------------------------------
- جلب قائمة المعاملات مع البحث والفلترة.
- جلب تفاصيل معاملة مع Timeline آمن.
- Capture للمعاملات التي لا تحتاج اتصالًا بمزود.
- Refund الإداري للطرق البنكية واليدوية.
- Cancel للمعاملات غير النهائية.

مهم:
-----------------------------------------------------
لا تنفذ هذه الخدمة أي عملية Provider وهمية.
المعاملة الإلكترونية لا تصبح Captured أو Refunded
محليًا قبل نجاح العملية لدى مزود الدفع.
=====================================================
*/

import mongoose from "mongoose";

import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";

import AppError from "../../utils/AppError.js";

import {
  PAYMENT_TRANSACTION_STATUSES,
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

import {
  PAYMENT_TRANSACTION_EVENT_CODES,
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";

import {
  findPaymentTransactionService,
  updatePaymentTransactionStatusService,
} from "./paymentTransaction-service.js";
import { getPaymentProviderByIdService } from "./payment-provider-service.js";
import { completeProviderPaymentService } from "./complete-provider-payment-service.js";
import {
  cancelProviderPayment,
  captureProviderPayment,
  refundProviderPayment,
} from "./providers/payment-provider-factory.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";

const validateObjectId = (
  value,
  field = "transactionId",
) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(
      "المعرف المرسل غير صالح",
      400,
      field,
    );
  }
};

const normalizeCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeStatus = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

const escapeRegExp = (value = "") =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const hasExternalProvider = (transaction) =>
  Boolean(
    transaction?.paymentProvider ||
      String(transaction?.providerCode || "").trim(),
  );

const executeExternalProviderOperation = async ({
  transaction,
  operation,
}) => {
  if (!hasExternalProvider(transaction)) return null;

  if (!transaction.paymentProvider) {
    throw new AppError("معاملة المزود لا تحتوي مرجع المزود", 409, "providerId");
  }

  const provider = await getPaymentProviderByIdService({
    providerId: transaction.paymentProvider,
    exposeCredentials: true,
  });
  const providerConfig = {
    environment: provider.environment,
    baseUrl: provider.baseUrl,
    credentials: provider.credentials || {},
  };
  const payload = {
    providerCode: transaction.providerCode || provider.code,
    referencedPaymentId: transaction.providerReference,
    amount: transaction.amount,
    currency: transaction.currency,
    providerConfig,
  };
  const operations = {
    capture: captureProviderPayment,
    refund: refundProviderPayment,
    cancel: cancelProviderPayment,
  };
  return operations[operation](payload);
};

const buildAdminTransactionItem = (
  transaction,
) => ({
  transactionId: transaction._id,
  draftBookingId:
    transaction.draftBooking?._id ||
    transaction.draftBooking ||
    null,
  bookingId:
    transaction.booking?._id ||
    transaction.booking ||
    null,
  bookingNumber:
    transaction.booking?.bookingNumber ||
    "",
  customer:
    transaction.booking?.customer ||
    null,
  paymentConfigurationId:
    transaction.paymentConfigurationId?._id ||
    transaction.paymentConfigurationId ||
    null,
  paymentMethodCode:
    transaction.methodCode,
  paymentMethodNameAr:
    transaction.methodNameAr || "",
  paymentMethodNameEn:
    transaction.methodNameEn || "",
  providerCode:
    transaction.providerCode || "",
  bankAccount:
    transaction.bankAccount || null,
  amount: transaction.amount,
  currency: transaction.currency,
  status:
    normalizeCode(transaction.status),
  paymentReference:
    transaction.paymentReference || "",
  providerReference:
    transaction.providerReference || "",
  checkoutId:
    transaction.checkoutId || "",
  transferReference:
    transaction.transferReference || "",
  transferDate:
    transaction.transferDate || null,
  failureReason:
    transaction.failureReason || "",
  rejectionReason:
    transaction.rejectionReason || "",
  verifiedBy:
    transaction.verifiedBy || null,
  verifiedAt:
    transaction.verifiedAt || null,
  createdBy:
    transaction.createdBy || null,
  updatedBy:
    transaction.updatedBy || null,
  createdAt:
    transaction.createdAt,
  updatedAt:
    transaction.updatedAt,
});

/*
=====================================================
List Payment Transactions
=====================================================
*/

export const listPaymentTransactionsAdminService =
  async ({
    page = 1,
    limit = 20,
    search = "",
    status = "",
    paymentMethodCode = "",
    providerCode = "",
    bookingId = "",
    draftBookingId = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "createdAt",
    sortDirection = "desc",
  } = {}) => {
    const safePage = Math.max(
      1,
      Number(page) || 1,
    );

    const safeLimit = Math.min(
      100,
      Math.max(
        1,
        Number(limit) || 20,
      ),
    );

    const filter = {
      isDeleted: false,
    };

    if (status) {
      filter.status = normalizeStatus(status);
    }

    if (paymentMethodCode) {
      filter.methodCode =
        normalizeCode(paymentMethodCode);
    }

    if (providerCode) {
      filter.providerCode =
        normalizeCode(providerCode);
    }

    if (bookingId) {
      validateObjectId(
        bookingId,
        "bookingId",
      );
      filter.booking = bookingId;
    }

    if (draftBookingId) {
      validateObjectId(
        draftBookingId,
        "draftBookingId",
      );
      filter.draftBooking = draftBookingId;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        const start = new Date(dateFrom);

        if (Number.isNaN(start.getTime())) {
          throw new AppError(
            "تاريخ البداية غير صالح",
            400,
            "dateFrom",
          );
        }

        filter.createdAt.$gte = start;
      }

      if (dateTo) {
        const end = new Date(dateTo);

        if (Number.isNaN(end.getTime())) {
          throw new AppError(
            "تاريخ النهاية غير صالح",
            400,
            "dateTo",
          );
        }

        end.setHours(
          23,
          59,
          59,
          999,
        );
        filter.createdAt.$lte = end;
      }
    }

    const normalizedSearch = String(
      search || "",
    ).trim();

    if (normalizedSearch) {
      const safeSearch =
        escapeRegExp(normalizedSearch);

      filter.$or = [
        {
          paymentReference: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          providerReference: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          checkoutId: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          transferReference: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          methodCode: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          providerCode: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    const allowedSortFields =
      new Set([
        "createdAt",
        "updatedAt",
        "amount",
        "status",
        "methodCode",
        "providerCode",
      ]);

    const safeSortBy =
      allowedSortFields.has(sortBy)
        ? sortBy
        : "createdAt";

    const safeSortDirection =
      String(sortDirection).toLowerCase() ===
      "asc"
        ? 1
        : -1;

    const skip =
      (safePage - 1) * safeLimit;

    const [items, total] =
      await Promise.all([
        PaymentTransaction.find(filter)
          .populate({
            path: "booking",
            select:
              "bookingNumber customer bookingStatus paymentStatus pricing",
          })
          .populate({
            path: "draftBooking",
            select:
              "customer status finalBooking",
          })
          .populate({
            path: "bankAccount",
            select:
              "bankNameAr bankNameEn accountNameAr accountNameEn iban currency",
          })
          .populate({
            path: "createdBy",
            select:
              "name firstName lastName username email",
          })
          .populate({
            path: "updatedBy",
            select:
              "name firstName lastName username email",
          })
          .sort({
            [safeSortBy]:
              safeSortDirection,
            _id: -1,
          })
          .skip(skip)
          .limit(safeLimit)
          .lean(),

        PaymentTransaction.countDocuments(
          filter,
        ),
      ]);

    return {
      items:
        items.map(
          buildAdminTransactionItem,
        ),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages:
          Math.ceil(
            total / safeLimit,
          ),
        hasNextPage:
          safePage * safeLimit <
          total,
        hasPreviousPage:
          safePage > 1,
      },
    };
  };

/*
=====================================================
Get Payment Transaction Details
=====================================================

تعيد Timeline والبيانات الإدارية الآمنة فقط.
لا تعيد metadata الداخلية أو raw gateway payload.
=====================================================
*/

export const getPaymentTransactionDetailsAdminService =
  async ({
    transactionId,
  }) => {
    validateObjectId(
      transactionId,
      "transactionId",
    );

    const transaction =
      await PaymentTransaction.findOne({
        _id: transactionId,
        isDeleted: false,
      })
        .select("+events")
        .populate({
          path: "booking",
          select:
            "bookingNumber customer bookingStatus paymentStatus paidAmount remainingAmount pricing",
        })
        .populate({
          path: "draftBooking",
          select:
            "customer status finalBooking currentStep",
        })
        .populate({
          path: "paymentConfigurationId",
          select:
            "sectionCode paymentMethodCode configurationType displayNameAr displayNameEn",
        })
        .populate({
          path: "paymentMethod",
          select:
            "code nameAr nameEn type",
        })
        .populate({
          path: "paymentProvider",
          select:
            "code nameAr nameEn environment",
        })
        .populate({
          path: "bankAccount",
          select:
            "bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban accountNumber swiftCode currency",
        })
        .populate({
          path: "createdBy updatedBy verifiedBy events.createdBy",
          select:
            "name firstName lastName username email role",
        })
        .lean();

    if (!transaction) {
      throw new AppError(
        "معاملة الدفع غير موجودة",
        404,
        "transactionId",
      );
    }

    return {
      ...buildAdminTransactionItem(
        transaction,
      ),
      draftBooking:
        transaction.draftBooking ||
        null,
      booking:
        transaction.booking || null,
      paymentConfiguration:
        transaction.paymentConfigurationId ||
        null,
      paymentMethod:
        transaction.paymentMethod ||
        null,
      paymentProvider:
        transaction.paymentProvider ||
        null,
      bankAccountSnapshot:
        transaction.bankAccountSnapshot ||
        {},
      proofAttachments:
        transaction.proofAttachments ||
        [],
      notes:
        transaction.notes || "",
      timeline:
        Array.isArray(transaction.events)
          ? transaction.events.map(
              (event) => ({
                fromStatus:
                  event.fromStatus
                    ? normalizeCode(
                        event.fromStatus,
                      )
                    : null,
                toStatus:
                  event.toStatus
                    ? normalizeCode(
                        event.toStatus,
                      )
                    : null,
                source:
                  event.source,
                eventCode:
                  event.eventCode,
                message:
                  event.message || "",
                providerReference:
                  event.providerReference ||
                  "",
                createdAt:
                  event.createdAt,
                createdBy:
                  event.createdBy ||
                  null,
              }),
            )
          : [],
    };
  };

/*
=====================================================
Capture Payment Transaction
=====================================================

تستخدم للطرق اليدوية أو نتيجة مزود تم تنفيذها خارجيًا
عبر Adapter موثوق. لا تنفذ Capture وهميًا للمزود.
=====================================================
*/

export const capturePaymentTransactionAdminService =
  async ({
    transactionId,
    notes = "",
    userId = null,
    req = null,
  }) => {
    const transaction =
      await findPaymentTransactionService({
        transactionId,
      });

    if (
      transaction.status ===
      PAYMENT_TRANSACTION_STATUSES.CAPTURED
    ) {
      return transaction;
    }

    const providerResult = await executeExternalProviderOperation({
      transaction,
      operation: "capture",
    });

    let updated = await updatePaymentTransactionStatusService({
      transactionId,
      toStatus:
        PAYMENT_TRANSACTION_STATUSES.CAPTURED,
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
      eventCode:
        PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_CAPTURED,
      message:
        String(notes || "").trim() ||
        "Payment captured by administrator",
      updatedBy: userId,
      req,
      auditAction: AUDIT_ACTIONS.CAPTURE,
      providerResult,
      providerReference:
        providerResult?.providerReference || undefined,
      extraUpdates: {
        notes:
          String(notes || "").trim(),
      },
    });

    if (providerResult && updated.draftBooking) {
      await completeProviderPaymentService({ transactionId, req });
      updated = await findPaymentTransactionService({ transactionId });
    }

    return updated;
  };

/*
=====================================================
Refund Payment Transaction
=====================================================

النسخة الحالية تدعم Full Refund للطرق اليدوية
والتحويل البنكي. معاملات المزود تتطلب Refund Adapter.
=====================================================
*/

export const refundPaymentTransactionAdminService =
  async ({
    transactionId,
    reason = "",
    userId = null,
    req = null,
  }) => {
    const transaction =
      await findPaymentTransactionService({
        transactionId,
      });

    if (
      transaction.status ===
      PAYMENT_TRANSACTION_STATUSES.REFUNDED
    ) {
      return transaction;
    }

    const allowedStatuses =
      new Set([
        PAYMENT_TRANSACTION_STATUSES.CAPTURED,
        PAYMENT_TRANSACTION_STATUSES.SUCCESS,
        PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
        PAYMENT_TRANSACTION_STATUSES.PARTIALLY_REFUNDED,
        LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
      ]);

    if (
      !allowedStatuses.has(
        transaction.status,
      )
    ) {
      throw new AppError(
        "لا يمكن استرجاع معاملة غير مدفوعة",
        409,
        "status",
      );
    }

    const providerResult = await executeExternalProviderOperation({
      transaction,
      operation: "refund",
    });

    return updatePaymentTransactionStatusService({
      transactionId,
      toStatus:
        PAYMENT_TRANSACTION_STATUSES.REFUNDED,
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
      eventCode:
        PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_REFUNDED,
      message:
        String(reason || "").trim() ||
        "Payment refunded by administrator",
      updatedBy: userId,
      req,
      auditAction: AUDIT_ACTIONS.REFUND,
      providerResult,
      providerReference:
        providerResult?.providerReference || undefined,
      extraUpdates: {
        notes:
          String(reason || "").trim(),
      },
    });
  };

/*
=====================================================
Cancel Payment Transaction
=====================================================
*/

export const cancelPaymentTransactionAdminService =
  async ({
    transactionId,
    reason = "",
    userId = null,
    req = null,
  }) => {
    const transaction =
      await findPaymentTransactionService({
        transactionId,
      });

    if (
      transaction.status ===
      PAYMENT_TRANSACTION_STATUSES.CANCELED
    ) {
      return transaction;
    }

    if (
      [
        PAYMENT_TRANSACTION_STATUSES.CAPTURED,
        PAYMENT_TRANSACTION_STATUSES.SUCCESS,
        PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
        PAYMENT_TRANSACTION_STATUSES.REFUNDED,
        PAYMENT_TRANSACTION_STATUSES.PARTIALLY_REFUNDED,
        LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
      ].includes(transaction.status)
    ) {
      throw new AppError(
        "لا يمكن إلغاء معاملة مالية مكتملة؛ استخدم الاسترجاع بدلًا من ذلك",
        409,
        "status",
      );
    }

    const providerResult = await executeExternalProviderOperation({
      transaction,
      operation: "cancel",
    });

    return updatePaymentTransactionStatusService({
      transactionId,
      toStatus:
        PAYMENT_TRANSACTION_STATUSES.CANCELED,
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.ADMIN,
      eventCode:
        PAYMENT_TRANSACTION_EVENT_CODES.PAYMENT_CANCELED,
      message:
        String(reason || "").trim() ||
        "Payment canceled by administrator",
      updatedBy: userId,
      req,
      auditAction: AUDIT_ACTIONS.CANCEL,
      providerResult,
      providerReference:
        providerResult?.providerReference || undefined,
      extraUpdates: {
        notes:
          String(reason || "").trim(),
      },
    });
  };
