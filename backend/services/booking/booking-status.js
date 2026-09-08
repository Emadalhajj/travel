// services/booking/booking-status.js

/*
=====================================================
Booking Status Service
=====================================================

هذا الملف مسؤول عن إدارة حالات الحجز والدفع.

المسؤوليات:
-----------------------------------------------------
1- تعريف حالات الحجز المسموحة.
2- تعريف حالات الدفع المسموحة.
3- التحقق من إمكانية الانتقال من حالة إلى حالة.
4- تحديث حالة الحجز حسب حالة الدفع.
5- منع الحالات غير المنطقية.

مهم:
-----------------------------------------------------
لا يقوم هذا الملف بإنشاء الحجز.
لا يقوم بحساب الأسعار.
لا يتعامل مع req/res.
=====================================================
*/

import AppError from "../../utils/AppError.js";
import { BOOKING_STATUS } from "../../constants/booking/booking-status.js";
import { PAYMENT_STATUS } from "../../constants/booking/payment-status.js";

/*
=====================================================
Constants
=====================================================
*/

/*
=====================================================
Allowed Transitions
=====================================================

هذه الخريطة تحدد الحالات المسموح الانتقال إليها.

مثال:
draft يمكن أن ينتقل إلى pending أو cancelled
confirmed يمكن أن ينتقل إلى completed أو cancelled
cancelled لا ينتقل لأي حالة أخرى
*/

const ALLOWED_BOOKING_TRANSITIONS = {
  [BOOKING_STATUS.DRAFT]: [
    BOOKING_STATUS.PENDING,
    BOOKING_STATUS.CANCELLED,
  ],

  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
  ],

  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
  ],

  [BOOKING_STATUS.COMPLETED]: [],

  [BOOKING_STATUS.CANCELLED]: [],
};

/*
=====================================================
Helpers
=====================================================
*/

export const isValidBookingStatus = (status) => {
  return Object.values(BOOKING_STATUS).includes(status);
};

export const isValidPaymentStatus = (status) => {
  return Object.values(PAYMENT_STATUS).includes(status);
};

export const canChangeBookingStatus = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;

  const allowedNextStatuses =
    ALLOWED_BOOKING_TRANSITIONS[currentStatus] || [];

  return allowedNextStatuses.includes(nextStatus);
};

/*
=====================================================
Validate Booking Status Change
=====================================================

تستخدم قبل تغيير حالة الحجز.

مثال:
validateBookingStatusChange({
  currentStatus: booking.bookingStatus,
  nextStatus: "confirmed",
  req
});
*/

export const validateBookingStatusChange = ({
  currentStatus,
  nextStatus,
  req = null,
}) => {

  if (!isValidBookingStatus(nextStatus)) {
    throw new AppError(
      "INVALID_BOOKING_STATUS",
      400,
      "bookingStatus",
    );
  }

  if (!isValidBookingStatus(currentStatus)) {
    throw new AppError(
      "INVALID_CURRENT_BOOKING_STATUS",
      400,
      "bookingStatus",
    );
  }

  if (!canChangeBookingStatus(currentStatus, nextStatus)) {
    throw new AppError(
      "BOOKING_STATUS_TRANSITION_INVALID",
      400,
      "bookingStatus",
      { from: currentStatus, to: nextStatus },
    );
  }

  return true;
};

/*
=====================================================
Validate Payment Status
=====================================================

تستخدم قبل تغيير حالة الدفع.
*/

export const validatePaymentStatus = ({
  paymentStatus,
  req = null,
}) => {

  if (!isValidPaymentStatus(paymentStatus)) {
    throw new AppError(
      "INVALID_PAYMENT_STATUS",
      400,
      "paymentStatus",
    );
  }

  return true;
};

/*
=====================================================
Resolve Booking Status From Payment
=====================================================

هذه الدالة تحدد حالة الحجز بناءً على حالة الدفع.

المنطق:
-----------------------------------------------------
- paid    => confirmed
- partial => pending
- failed  => pending
- pending => pending
- refunded => cancelled
*/

export const resolveBookingStatusFromPayment = (paymentStatus) => {
  switch (paymentStatus) {
    case PAYMENT_STATUS.PAID:
      return BOOKING_STATUS.CONFIRMED;

    case PAYMENT_STATUS.PARTIAL:
      return BOOKING_STATUS.PENDING;

    case PAYMENT_STATUS.FAILED:
      return BOOKING_STATUS.PENDING;

    case PAYMENT_STATUS.REFUNDED:
      return BOOKING_STATUS.CANCELLED;

    case PAYMENT_STATUS.PENDING:
    default:
      return BOOKING_STATUS.PENDING;
  }
};

/*
=====================================================
Apply Payment Status To Booking
=====================================================

تستخدم عند تحديث الدفع.

مثال:
const statusData = applyPaymentStatusToBooking({
  booking,
  paymentStatus: "paid"
});

ثم:
booking.paymentStatus = statusData.paymentStatus;
booking.bookingStatus = statusData.bookingStatus;
*/

export const applyPaymentStatusToBooking = ({
  booking,
  paymentStatus,
  req = null,
}) => {
  validatePaymentStatus({
    paymentStatus,
    req,
  });

  const nextBookingStatus =
    resolveBookingStatusFromPayment(paymentStatus);

  return {
    paymentStatus,
    bookingStatus: nextBookingStatus,
  };
};

/*
=====================================================
Can Cancel Booking
=====================================================

تتحقق هل يمكن إلغاء الحجز.

لا يمكن إلغاء:
- completed
- cancelled
*/

export const canCancelBooking = (booking) => {
  if (!booking) return false;

  return ![
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
  ].includes(booking.bookingStatus);
};

/*
=====================================================
Cancel Booking
=====================================================

ترجع البيانات اللازمة لإلغاء الحجز.
لا تحفظ في قاعدة البيانات، فقط ترجع object.
*/

export const getCancelBookingData = ({
  booking,
  req = null,
}) => {

  if (!canCancelBooking(booking)) {
    throw new AppError(
      "BOOKING_CANCELLATION_FORBIDDEN",
      400,
      "bookingStatus",
    );
  }

  return {
    bookingStatus: BOOKING_STATUS.CANCELLED,
    cancelledAt: new Date(),
  };
};

/*
=====================================================
Confirm Booking
=====================================================

ترجع بيانات تأكيد الحجز.
*/

export const getConfirmBookingData = ({
  booking,
  req = null,
}) => {
  validateBookingStatusChange({
    currentStatus: booking.bookingStatus,
    nextStatus: BOOKING_STATUS.CONFIRMED,
    req,
  });

  return {
    bookingStatus: BOOKING_STATUS.CONFIRMED,
    confirmedAt: new Date(),
  };
};

/*
=====================================================
Complete Booking
=====================================================

ترجع بيانات إكمال الحجز بعد انتهاء الرحلة.
*/

export const getCompleteBookingData = ({
  booking,
  req = null,
}) => {
  validateBookingStatusChange({
    currentStatus: booking.bookingStatus,
    nextStatus: BOOKING_STATUS.COMPLETED,
    req,
  });

  return {
    bookingStatus: BOOKING_STATUS.COMPLETED,
  };
};
