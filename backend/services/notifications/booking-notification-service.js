// services/notifications/booking-notification-service.js

/*
=====================================================
Booking Notification Service
=====================================================

هذا الملف يحتوي إشعارات جاهزة خاصة بالحجوزات.

بدلاً من كتابة نص الإشعار في كل Controller،
نكتبها هنا مرة واحدة.

الاستخدام:
-----------------------------------------------------
await sendBookingCreatedNotification(...)
await sendBookingConfirmedNotification(...)
await sendPaymentReceivedNotification(...)
=====================================================
*/

export const sendBookingCreatedNotification = async ({
  Notification,
  booking,
  user,
  req = null,
  sendNotification,
}) => {
  return await sendNotification({
    Notification,
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم إنشاء الحجز",
    titleEn: "Booking Created",

    messageAr: `تم إنشاء الحجز رقم ${booking.bookingNumber} بنجاح.`,
    messageEn: `Booking ${booking.bookingNumber} has been created successfully.`,

    channel: "database",
    type: "booking_created",

    metadata: {
      bookingNumber: booking.bookingNumber,
      totalPrice: booking.pricing?.totalPrice,
      bookingStatus: booking.bookingStatus,
    },

    createdBy: req?.user?._id,
  });
};

export const sendBookingConfirmedNotification = async ({
  Notification,
  booking,
  user,
  req = null,
  sendNotification,
}) => {
  return await sendNotification({
    Notification,
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم تأكيد الحجز",
    titleEn: "Booking Confirmed",

    messageAr: `تم تأكيد الحجز رقم ${booking.bookingNumber}.`,
    messageEn: `Booking ${booking.bookingNumber} has been confirmed.`,

    channel: "database",
    type: "booking_confirmed",

    metadata: {
      bookingNumber: booking.bookingNumber,
      confirmedAt: booking.confirmedAt,
    },

    createdBy: req?.user?._id,
  });
};

export const sendBookingCancelledNotification = async ({
  Notification,
  booking,
  user,
  req = null,
  sendNotification,
}) => {
  return await sendNotification({
    Notification,
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم إلغاء الحجز",
    titleEn: "Booking Cancelled",

    messageAr: `تم إلغاء الحجز رقم ${booking.bookingNumber}.`,
    messageEn: `Booking ${booking.bookingNumber} has been cancelled.`,

    channel: "database",
    type: "booking_cancelled",

    metadata: {
      bookingNumber: booking.bookingNumber,
      cancelledAt: booking.cancelledAt,
    },

    createdBy: req?.user?._id,
  });
};

export const sendPaymentReceivedNotification = async ({
  Notification,
  booking,
  amount,
  user,
  req = null,
  sendNotification,
}) => {
  return await sendNotification({
    Notification,
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم استلام دفعة",
    titleEn: "Payment Received",

    messageAr: `تم استلام دفعة بقيمة ${amount} ${booking.pricing?.currency || "SAR"} للحجز رقم ${booking.bookingNumber}.`,
    messageEn: `Payment of ${amount} ${booking.pricing?.currency || "SAR"} has been received for booking ${booking.bookingNumber}.`,

    channel: "database",
    type: "payment_received",

    metadata: {
      bookingNumber: booking.bookingNumber,
      amount,
      paidAmount: booking.paidAmount,
      remainingAmount: booking.remainingAmount,
    },

    createdBy: req?.user?._id,
  });
};