// services/booking/booking-log-service.js

/*
=====================================================
Booking Log Service
=====================================================

هذا الملف مسؤول عن إنشاء سجلات Timeline للحجز.

المسؤوليات:
-----------------------------------------------------
1- إنشاء log جديد.
2- تجهيز بيانات المستخدم.
3- تجهيز رسائل عربية وإنجليزية.
4- عدم وضع منطق Controller هنا.
=====================================================
*/

export const createBookingLog = async ({
  BookingLog,
  booking,
  action,
  messageAr = "",
  messageEn = "",
  oldValue = null,
  newValue = null,
  req = null,
}) => {
  if (!booking || !action) return null;

  return await BookingLog.create({
    booking,
    action,
    messageAr,
    messageEn,
    oldValue,
    newValue,
    performedBy: req?.user?._id,
    role: req?.user?.role || "",
    ipAddress: req?.ip || "",
    userAgent: req?.headers?.["user-agent"] || "",
  });
};

export const logBookingCreated = async ({
  BookingLog,
  booking,
  req,
}) => {
  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "booking_created",
    messageAr: `تم إنشاء الحجز رقم ${booking.bookingNumber}`,
    messageEn: `Booking ${booking.bookingNumber} has been created`,
    newValue: {
      bookingNumber: booking.bookingNumber,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.pricing?.totalPrice,
    },
    req,
  });
};

export const logBookingUpdated = async ({
  BookingLog,
  booking,
  oldValue,
  newValue,
  req,
}) => {
  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "booking_updated",
    messageAr: `تم تحديث الحجز رقم ${booking.bookingNumber}`,
    messageEn: `Booking ${booking.bookingNumber} has been updated`,
    oldValue,
    newValue,
    req,
  });
};

export const logBookingStatusChanged = async ({
  BookingLog,
  booking,
  oldStatus,
  newStatus,
  req,
}) => {
  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "booking_status_changed",
    messageAr: `تم تغيير حالة الحجز من ${oldStatus} إلى ${newStatus}`,
    messageEn: `Booking status changed from ${oldStatus} to ${newStatus}`,
    oldValue: {
      bookingStatus: oldStatus,
    },
    newValue: {
      bookingStatus: newStatus,
    },
    req,
  });
};

export const logPaymentStatusChanged = async ({
  BookingLog,
  booking,
  oldStatus,
  newStatus,
  oldPaidAmount,
  newPaidAmount,
  req,
}) => {
  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "payment_status_changed",
    messageAr: `تم تغيير حالة الدفع من ${oldStatus} إلى ${newStatus}`,
    messageEn: `Payment status changed from ${oldStatus} to ${newStatus}`,
    oldValue: {
      paymentStatus: oldStatus,
      paidAmount: oldPaidAmount,
    },
    newValue: {
      paymentStatus: newStatus,
      paidAmount: newPaidAmount,
    },
    req,
  });
};

export const logBookingCancelled = async ({
  BookingLog,
  booking,
  req,
}) => {
  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "booking_cancelled",
    messageAr: `تم إلغاء الحجز رقم ${booking.bookingNumber}`,
    messageEn: `Booking ${booking.bookingNumber} has been cancelled`,
    newValue: {
      bookingStatus: booking.bookingStatus,
      cancelledAt: booking.cancelledAt,
    },
    req,
  });
};

export const logPaymentTransactionCreated = async ({
  BookingLog,
  booking,
  paymentTransaction,
  req,
}) => {
  if (!booking || !paymentTransaction) return null;

  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "payment_transaction_created",
    messageAr: `تم تسجيل دفعة بمبلغ ${paymentTransaction.amount} ${paymentTransaction.currency}`,
    messageEn: `Payment transaction created with amount ${paymentTransaction.amount} ${paymentTransaction.currency}`,
    newValue: {
      paymentTransaction: paymentTransaction._id,
      amount: paymentTransaction.amount,
      currency: paymentTransaction.currency,
      method: paymentTransaction.method,
      status: paymentTransaction.status,
      transactionId: paymentTransaction.transactionId,
    },
    req,
  });
};
//===== إضافة Log منفصل لحجز المخزون حتى يظهر في Timeline أن المخزون تم حجزه عند تحويل المسودة إلى حجز. ز =====
export const logInventoryReserved = async ({
  BookingLog,
  booking,
  inventoryReservations = [],
  req,
}) => {
  if (!booking || !inventoryReservations.length) return null;

  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "inventory_reserved",
    messageAr: "تم حجز المخزون المرتبط بالحجز",
    messageEn: "Inventory has been reserved for this booking",
    newValue: {
      reservations: inventoryReservations.map((item) => ({
        type: item.type,
        itemId: item.itemId,
        reservedDates: item.result?.reservedDates || 0,
      })),
    },
    req,
  });
};
//==================== إضافة Log عند إنشاء الفاوتشر ====================
export const logVoucherCreated = async ({
  BookingLog,
  booking,
  voucher,
  req,
}) => {
  if (!booking || !voucher) return null;

  return createBookingLog({
    BookingLog,
    booking: booking._id,
    action: "voucher_created",
    messageAr: `تم إنشاء الفاوتشر رقم ${voucher.voucherNumber}`,
    messageEn: `Voucher ${voucher.voucherNumber} has been created`,
    newValue: {
      voucher: voucher._id,
      voucherNumber: voucher.voucherNumber,
      pdfUrl: voucher.pdfUrl,
      status: voucher.status,
    },
    req,
  });
};