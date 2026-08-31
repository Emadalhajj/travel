/*
getAllBookings يعرض كل الحجوزات مع البحث والفلترة والترتيب والصفحات.

getMyBookings يعرض حجوزات المستخدم الحالي فقط.

getBookingById يعرض حجز واحد مع populate لكل العلاقات.

cancelBooking يلغي الحجز بطريقة آمنة.

changeBookingStatus يغير حالة الحجز حسب القواعد الموجودة في booking-status.js.

changePaymentStatus يحدث الدفع ويغير حالة الحجز بناءً عليه.

*/

// controllers/booking/booking-controller.js

import asyncHandler from "express-async-handler";

import Booking from "../../models/booking/booking-model.js";
import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";

import {
  buildBookingFilter,
  allowedBookingSortFields,
} from "../../utils/Builders/buildBookingFilter.js";
import { buildNotDeletedFilter } from "../../utils/buildNotDeletedFilter.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import AppError from "../../utils/AppError.js";


import {
  applyPaymentStatusToBooking,
  getCancelBookingData,
  getConfirmBookingData,
  getCompleteBookingData,
  validateBookingStatusChange,
} from "../../services/booking/booking-status.js";

import BookingLog from "../../models/bookingLog-model.js";

import {
  logBookingStatusChanged,
  logPaymentStatusChanged,
  logBookingCancelled,
} from "../../services/booking/booking-log-service.js";

import {
  sendBookingConfirmedNotification,
  sendBookingCancelledNotification,
} from "../../services/notifications/booking-notification-service.js";
import { softDeleteBooking } from "../../services/booking/bookingService.js";

/*
=====================================================
Helpers
=====================================================
*/

const buildBookingSort = (query = {}) => {
  if (!query.sort) {
    return { createdAt: -1 };
  }

  const [field, order] = query.sort.split("_");

  if (!allowedBookingSortFields.includes(field)) {
    return { createdAt: -1 };
  }

  return {
    [field]: order === "asc" ? 1 : -1,
  };
};

export const BOOKING_LIST_PROJECTION = {
  _id: 1,
  bookingNumber: 1,
  bookingStatus: 1,
  paymentStatus: 1,
  "customer.name": 1,
  "program.nameAr": 1,
  "program.nameEn": 1,
  "pricing.total": 1,
  "pricing.totalPrice": 1,
  "pricing.currency": 1,
  totalPilgrims: 1,
  createdAt: 1,
};

export const bookingDetailsPopulate = [
  { path: "user", select: "firstName lastName username email role" },
  { path: "hotel", select: "nameAr nameEn stars hotelType location images" },
  {
    path: "roomType",
    select: "nameAr nameEn capacity pricing totalRooms images",
  },
  {
    path: "visa",
    select: "name description duration validity price visaType country",
  },
  {
    path: "trip",
    select: "nameAr nameEn tripType fromCity toCity startDate pricing capacity",
  },
  { path: "transport", select: "nameAr nameEn vehicleType capacity images" },
  { path: "createdBy", select: "firstName lastName username email" },
  { path: "updatedBy", select: "firstName lastName username email" },
];

export const serializeBookingListItem = (booking = {}) => ({
  _id: booking._id,
  bookingNumber: booking.bookingNumber || "",
  bookingStatus: booking.bookingStatus || "",
  paymentStatus: booking.paymentStatus || "",
  customer: { name: booking.customer?.name || "" },
  program: {
    nameAr: booking.program?.nameAr || "",
    nameEn: booking.program?.nameEn || "",
  },
  pricing: {
    total: booking.pricing?.total ?? booking.pricing?.totalPrice ?? 0,
    totalPrice: booking.pricing?.totalPrice ?? booking.pricing?.total ?? 0,
    currency: booking.pricing?.currency || "SAR",
  },
  pilgrimsCount: Number(booking.totalPilgrims) || 0,
  totalPilgrims: Number(booking.totalPilgrims) || 0,
  createdAt: booking.createdAt,
});

/*
=====================================================
GET ALL BOOKINGS
=====================================================
*/

export const getAllBookings = asyncHandler(async (req, res) => {
  const filter = buildNotDeletedFilter(
    buildBookingFilter(req.query),
  );

  const sortOption = buildBookingSort(req.query);
  const { page, skip, limit } = buildPagination(req.query);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate(bookingDetailsPopulate),

    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    data: bookings,
  });
});

/*
=====================================================
GET MY BOOKINGS
=====================================================
*/

export const getMyBookings = asyncHandler(async (req, res) => {
  const filter = buildNotDeletedFilter({
    ...buildBookingFilter(req.query),
    user: req.user._id,
  });

  const sortOption = buildBookingSort(req.query);
  const { page, skip, limit } = buildPagination(req.query);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .select(BOOKING_LIST_PROJECTION)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    data: bookings.map(serializeBookingListItem),
  });
});

/*
=====================================================
GET BOOKING BY ID
=====================================================
*/

export const getBookingById = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findOne(
    buildNotDeletedFilter({
      _id: req.params.id,
      user: req.user._id,
    }),
  ).populate(bookingDetailsPopulate);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const bookingData = booking.toObject();

  const needsDraftSnapshot =
    !bookingData.customer?.name ||
    !bookingData.program?.nameAr ||
    !bookingData.data?.selectedProducts;

  if (needsDraftSnapshot) {
    const draft = await DraftBooking.findOne({
      finalBooking: booking._id,
      isDeleted: { $ne: true },
    }).lean();

    if (draft) {
      bookingData.customer = bookingData.customer?.name
        ? bookingData.customer
        : draft.customer || {};

      bookingData.program = bookingData.program?.nameAr
        ? bookingData.program
        : draft.program || {};

      bookingData.data = {
        ...(draft.data || {}),
        ...(bookingData.data || {}),
      };
    }
  }

  res.status(200).json({
    success: true,
    data: bookingData,
  });
});

/*
=====================================================
DELETE BOOKING
=====================================================
*/
export const deleteBooking = asyncHandler(async (req, res, next) => {
  const isArabic = isArabicRequest(req);

  const booking = await softDeleteBooking({
    bookingId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم حذف الحجز بنجاح"
      : "Booking deleted successfully",
    data: booking,
  });
});

/*
=====================================================
CANCEL BOOKING
=====================================================
*/

export const cancelBooking = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findOne(buildNotDeletedFilter({
    _id: req.params.id,
    user: req.user._id,
  }));

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const cancelData = getCancelBookingData({
    booking,
    req,
  });

  Object.assign(booking, {
    ...cancelData,
    updatedBy: req.user?._id,
  });

  await booking.save();

  await logBookingCancelled({
    BookingLog,
    booking,
    req,
  });

await sendBookingCancelledNotification({
  booking,
  req,
});

  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم إلغاء الحجز بنجاح"
      : "Booking cancelled successfully",
    data: booking,
  });
});

/*
=====================================================
CHANGE BOOKING STATUS
=====================================================
*/

export const changeBookingStatus = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);
  const { bookingStatus } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }
  const oldStatus = booking.bookingStatus;

  validateBookingStatusChange({
    currentStatus: booking.bookingStatus,
    nextStatus: bookingStatus,
    req,
  });

  booking.bookingStatus = bookingStatus;
  booking.updatedBy = req.user?._id;

  if (bookingStatus === "confirmed") {
    booking.confirmedAt = new Date();
  }

  if (bookingStatus === "cancelled") {
    booking.cancelledAt = new Date();
  }

  await booking.save();

  await logBookingStatusChanged({
    BookingLog,
    booking,
    oldStatus,
    newStatus: booking.bookingStatus,
    req,
  });

  res.status(200).json({
    success: true,
    message: isArabic ? "تم تغيير حالة الحجز" : "Booking status updated",
    data: booking,
  });
});

/*
=====================================================
CONFIRM BOOKING
=====================================================
*/

export const confirmBooking = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const confirmData = getConfirmBookingData({
    booking,
    req,
  });

  Object.assign(booking, {
    ...confirmData,
    updatedBy: req.user?._id,
  });

  await booking.save();

await sendBookingConfirmedNotification({
  booking,
  req,
});
  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم تأكيد الحجز بنجاح"
      : "Booking confirmed successfully",
    data: booking,
  });
});

/*
=====================================================
COMPLETE BOOKING
=====================================================
*/

export const completeBooking = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const completeData = getCompleteBookingData({
    booking,
    req,
  });

  Object.assign(booking, {
    ...completeData,
    updatedBy: req.user?._id,
  });

  await booking.save();

  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم إكمال الحجز بنجاح"
      : "Booking completed successfully",
    data: booking,
  });
});

/*
=====================================================
CHANGE PAYMENT STATUS
=====================================================
*/

export const changePaymentStatus = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);
  const { paymentStatus, paidAmount = 0, paymentMethod = "" } = req.body;
const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const oldPaymentStatus = booking.paymentStatus;
  const oldPaidAmount = booking.paidAmount;

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const statusData = applyPaymentStatusToBooking({
    booking,
    paymentStatus,
    req,
  });

  booking.paymentStatus = statusData.paymentStatus;
  booking.bookingStatus = statusData.bookingStatus;
  booking.paymentMethod = paymentMethod || booking.paymentMethod;

  booking.paidAmount = Number(paidAmount) || booking.paidAmount || 0;

  booking.remainingAmount = Math.max(
    0,
    (booking.pricing?.totalPrice || 0) - booking.paidAmount,
  );

  booking.updatedBy = req.user?._id;

  if (booking.bookingStatus === "confirmed") {
    booking.confirmedAt = new Date();
  }

  await booking.save();

  await logPaymentStatusChanged({
    BookingLog,
    booking,
    oldStatus: oldPaymentStatus,
    newStatus: booking.paymentStatus,
    oldPaidAmount,
    newPaidAmount: booking.paidAmount,
    req,
  });

  res.status(200).json({
    success: true,
    message: isArabic ? "تم تحديث حالة الدفع" : "Payment status updated",
    data: booking,
  });
});
