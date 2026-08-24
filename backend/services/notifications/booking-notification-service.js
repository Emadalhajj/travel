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
=====================================================
*/

import { sendNotificationChannels } from "./notification-channel-service.js";
import { NOTIFICATION_TYPES } from "../../constants/notifications/notification-constants.js";

const sendBookingEvent = ({ booking, user, req, event, payload }) =>
  sendNotificationChannels({
    payload,
    deduplicationBase: `booking:${booking._id}:${event}`,
    email: booking.customer?.email || user?.email || "",
    req,
  });

export const sendBookingCreatedNotification = async ({
  booking,
  user,
  req = null,
}) => {
  return sendBookingEvent({ booking, user, req, event: "created", payload: {
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم إنشاء الحجز",
    titleEn: "Booking Created",

    messageAr: `تم إنشاء الحجز رقم ${booking.bookingNumber} بنجاح.`,
    messageEn: `Booking ${booking.bookingNumber} has been created successfully.`,

    type: NOTIFICATION_TYPES.BOOKING_CREATED,

    metadata: {
      bookingNumber: booking.bookingNumber,
      totalPrice: booking.pricing?.totalPrice,
      bookingStatus: booking.bookingStatus,
    },

    createdBy: req?.user?._id,
  }});
};

export const sendBookingConfirmedNotification = async ({
  booking,
  user,
  req = null,
}) => {
  return sendBookingEvent({ booking, user, req, event: "confirmed", payload: {
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم تأكيد الحجز",
    titleEn: "Booking Confirmed",

    messageAr: `تم تأكيد الحجز رقم ${booking.bookingNumber}.`,
    messageEn: `Booking ${booking.bookingNumber} has been confirmed.`,

    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,

    metadata: {
      bookingNumber: booking.bookingNumber,
      confirmedAt: booking.confirmedAt,
    },

    createdBy: req?.user?._id,
  }});
};

export const sendBookingCancelledNotification = async ({
  booking,
  user,
  req = null,
}) => {
  return sendBookingEvent({ booking, user, req, event: "cancelled", payload: {
    user: user?._id || booking.user,
    booking: booking._id,

    titleAr: "تم إلغاء الحجز",
    titleEn: "Booking Cancelled",

    messageAr: `تم إلغاء الحجز رقم ${booking.bookingNumber}.`,
    messageEn: `Booking ${booking.bookingNumber} has been cancelled.`,

    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,

    metadata: {
      bookingNumber: booking.bookingNumber,
      cancelledAt: booking.cancelledAt,
    },

    createdBy: req?.user?._id,
  }});
};

export const sendInitialBookingNotification = async ({
  booking,
  user,
  req = null,
}) => {
  if (String(booking?.bookingStatus || "").toLowerCase() === "confirmed") {
    return sendBookingConfirmedNotification({ booking, user, req });
  }
  return sendBookingCreatedNotification({ booking, user, req });
};
