// controllers/payment/paymentTransaction-controller.js

/*
=====================================================
Payment Transaction Controller
=====================================================

هذا الملف مسؤول عن API عمليات الدفع.

المسؤوليات:
-----------------------------------------------------
1- إنشاء دفعة لحجز.
2- عرض دفعات حجز معين.
3- عرض كل الدفعات للإدارة.
=====================================================
*/

import asyncHandler from "express-async-handler";

import Booking from "../../models/booking/booking-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";

import { buildPagination } from "../../utils/Builders/buildPagination.js";
import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

import {
  createPaymentTransactionService,
  applyPaymentSummaryToBooking,
} from "../../services/payment/paymentTransaction-service.js";

import { sendPaymentReceivedNotification } from "../../services/notifications/payment-notification-service.js";
import {
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

/*
=====================================================
CREATE PAYMENT TRANSACTION
=====================================================
*/

export const createPaymentTransaction = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const data = req.body || {};
  const transaction = await createPaymentTransactionService({
    draftBooking: data.draftBooking || null,
    booking: data.booking || null,
    user: data.user || req.user?._id || null,
    paymentConfigurationId: data.paymentConfigurationId || null,
    paymentMethodId: data.paymentMethodId || data.paymentMethod || null,
    paymentMethodCode: data.paymentMethodCode || data.methodCode || data.method,
    providerId: data.providerId || data.paymentProvider || null,
    bankAccountId: data.bankAccountId || data.bankAccount || null,
    bankAccountSnapshot: data.bankAccountSnapshot || {},
    providerCode: data.providerCode || data.gateway || "",
    providerEnvironment: data.providerEnvironment || "",
    amount: data.amount,
    currency: data.currency || "SAR",
    status: data.status,
    paymentReference: data.paymentReference || "",
    createdBy: req.user?._id || null,
    eventSource: "ADMIN",
    req,
  });

  await transaction.populate([
    {
      path: "booking",
      select: "bookingNumber pricing paymentStatus bookingStatus",
    },
    { path: "user", select: "firstName lastName username email" },
    { path: "createdBy", select: "firstName lastName username email" },
  ]);

  try {
    const booking = await Booking.findById(
      transaction.booking,
    );

    if (
      booking &&
      [
        PAYMENT_TRANSACTION_STATUSES.SUCCESS,
        LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID,
      ].includes(transaction.status)
    ) {
      await sendPaymentReceivedNotification({
        transaction,
        booking,
        req,
      });
    }
  } catch (notificationError) {
    console.error(
      "Payment notification failed:",
      notificationError,
    );
  }

  res.status(201).json({
    success: true,
    message: isArabic
      ? "تم تسجيل عملية الدفع بنجاح"
      : "Payment transaction created successfully",
    data: transaction,
  });
});

/*
=====================================================
GET BOOKING PAYMENTS
=====================================================
*/

export const getBookingPayments = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    throw new AppError(
      "BOOKING_NOT_FOUND",
      404,
      "booking",
    );
  }

  const payments = await PaymentTransaction.find({
    booking: booking._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .populate("createdBy", "firstName lastName username email");

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

/*
=====================================================
GET ALL PAYMENT TRANSACTIONS
=====================================================
*/

export const getAllPaymentTransactions = asyncHandler(async (req, res) => {
  const filter = {
    isDeleted: false,
  };

  const requestedMethod =
    req.query.methodCode ||
    req.query.method;

  if (requestedMethod) {
    filter.methodCode = String(
      requestedMethod,
    ).toUpperCase();
  }

  if (req.query.booking) {
    filter.booking = req.query.booking;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const { page, skip, limit } = buildPagination(req.query);

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("booking", "bookingNumber pricing paymentStatus bookingStatus")
      .populate("user", "firstName lastName username email")
      .populate("createdBy", "firstName lastName username email"),

    PaymentTransaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    data: transactions,
  });
});

/*
=====================================================
REFUND PAYMENT TRANSACTION
=====================================================
*/

export const refundPaymentTransaction = asyncHandler(
  async (req, res) => {
    const isArabic = isArabicRequest(req);

    const transaction =
      await PaymentTransaction.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

    if (!transaction) {
      throw new AppError("PAYMENT_TRANSACTION_NOT_FOUND",
        404,
        "payment",
      );
    }

    if (transaction.status === "refunded") {
      throw new AppError("PAYMENT_ALREADY_REFUNDED",
        400,
        "status",
      );
    }

    if (transaction.status !== "paid") {
      throw new AppError("PAYMENT_REFUND_NOT_PAID",
        400,
        "status",
      );
    }

    /*
    مؤقتًا:
    هذا تحديث إداري فقط.

    لاحقًا عند الربط الحقيقي يجب أولًا تنفيذ
    Refund لدى HyperPay ثم تحديث الحالة محليًا.
    */

    transaction.status = "refunded";

    transaction.notes =
      req.body.notes ||
      transaction.notes ||
      "Refunded by administrator";

    await transaction.save();

    if (transaction.booking) {
      const booking = await Booking.findById(
        transaction.booking,
      );

      if (booking) {
        await applyPaymentSummaryToBooking({
          booking,
          PaymentTransaction,
        });
      }
    }

    res.status(200).json({
      success: true,

      message: isArabic
        ? "تم استرجاع عملية الدفع"
        : "Payment transaction refunded",

      data: transaction,
    });
  },
);
