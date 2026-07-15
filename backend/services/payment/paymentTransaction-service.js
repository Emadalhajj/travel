// services/payment/paymentTransaction-service.js

/*
=====================================================
Payment Transaction Service
=====================================================

هذا الملف يحتوي منطق الدفع.

المسؤوليات:
-----------------------------------------------------
1- إنشاء عملية دفع.
2- تحديث إجمالي المدفوع داخل الحجز.
3- تحديث حالة الدفع.
4- تحديث حالة الحجز بناءً على الدفع.
=====================================================
*/

import AppError from "../../utils/AppError.js";
import { roundPrice } from "../../utils/roundPrice.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

const getLanguage = (req) => {
  return req ? isArabicRequest(req) : true;
};

export const calculateBookingPaymentSummary = async ({
  booking,
  PaymentTransaction,
}) => {
  const transactions = await PaymentTransaction.find({
    booking: booking._id,
    status: "paid",
  }).lean();

  const paidAmount = transactions.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  const totalPrice = Number(booking.pricing?.totalPrice) || 0;

  const remainingAmount = Math.max(
    0,
    roundPrice(totalPrice - paidAmount),
  );

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

export const applyPaymentSummaryToBooking = async ({
  booking,
  PaymentTransaction,
}) => {
  const summary = await calculateBookingPaymentSummary({
    booking,
    PaymentTransaction,
  });

  booking.paidAmount = summary.paidAmount;
  booking.remainingAmount = summary.remainingAmount;
  booking.paymentStatus = summary.paymentStatus;

  if (summary.paymentStatus === "paid") {
    booking.bookingStatus = "confirmed";
    booking.confirmedAt = booking.confirmedAt || new Date();
  } else if (summary.paymentStatus === "partial") {
    booking.bookingStatus = "pending";
  }

  await booking.save();

  return booking;
};

export const createPaymentTransactionService = async ({
  Booking,
  PaymentTransaction,
  data,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  const booking = await Booking.findById(data.booking);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  if (booking.bookingStatus === "cancelled") {
    throw new AppError(
      isArabic
        ? "لا يمكن إضافة دفعة لحجز ملغي"
        : "Cannot add payment to cancelled booking",
      400,
      "bookingStatus",
    );
  }

  const transaction = await PaymentTransaction.create({
    booking: booking._id,
    user: booking.user,
    amount: Number(data.amount) || 0,
    currency: data.currency || booking.pricing?.currency || "SAR",
    method: data.method || "cash",
    status: data.status || "paid",
    transactionId: data.transactionId || "",
    gateway: data.gateway || "",
    gatewayResponse: data.gatewayResponse || {},
    notes: data.notes || "",
    createdBy: req?.user?._id,
  });

  await applyPaymentSummaryToBooking({
    booking,
    PaymentTransaction,
  });

  return transaction;
};