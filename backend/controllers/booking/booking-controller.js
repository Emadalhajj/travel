/*
getAllBookings يعرض كل الحجوزات مع البحث والفلترة والترتيب والصفحات.

getMyBookings يعرض حجوزات المستخدم الحالي فقط.

getBookingById يعرض حجز واحد مع populate لكل العلاقات.

createBooking يقوم بالترتيب التالي:

قراءة البيانات.
تطبيع البيانات.
التحقق من وجود مستخدم ومعتمرين.
التحقق من التوفر.
حساب الأسعار.
بناء snapshot.
توليد رقم الحجز.
إنشاء الحجز.

updateBooking يعيد حساب التوفر والسعر والـ snapshot عند تعديل الحجز.

cancelBooking يلغي الحجز بطريقة آمنة.

changeBookingStatus يغير حالة الحجز حسب القواعد الموجودة في booking-status.js.

changePaymentStatus يحدث الدفع ويغير حالة الحجز بناءً عليه.

previewBookingPrice يعرض السعر المتوقع قبل إنشاء الحجز.
*/

// controllers/booking/booking-controller.js

import asyncHandler from "express-async-handler";

import Booking from "../../models/booking/booking-model.js";
import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import Hotel from "../../models/hotels/hotel-model.js";
import RoomType from "../../models/hotels/roomType-model.js";
import Visa from "../../models/visa-model.js";
import Trip from "../../models/transportition/trip-model.js";
import Transport from "../../models/transportition/transport-model.js";
import { Counter } from "../../models/counterModel.js";

import { normalizeBooking } from "../../utils/domain/normalizeBooking.js";
import {
  buildBookingFilter,
  allowedBookingSortFields,
} from "../../utils/Builders/buildBookingFilter.js";
import { buildNotDeletedFilter } from "../../utils/buildNotDeletedFilter.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { safeJsonParse } from "../../utils/generic/safeJsonParse.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import AppError from "../../utils/AppError.js";

import { checkBookingAvailability } from "../../services/booking/availability.js";
// import { calculateFullBookingPricing } from "../../services/booking/booking-pricing.js";
import { calculateFullBookingPricing } from "../../services/pricing/booking-pricing.js";

import {
  applyPaymentStatusToBooking,
  getCancelBookingData,
  getConfirmBookingData,
  getCompleteBookingData,
  validateBookingStatusChange,
} from "../../services/booking/booking-status.js";

import BookingLog from "../../models/bookingLog-model.js";

import {
  logBookingCreated,
  logBookingUpdated,
  logBookingStatusChanged,
  logPaymentStatusChanged,
  logBookingCancelled,
} from "../../services/booking/booking-log-service.js";

import {
  sendInitialBookingNotification,
  sendBookingConfirmedNotification,
  sendBookingCancelledNotification,
} from "../../services/notifications/booking-notification-service.js";
import { softDeleteBooking } from "../../services/booking/bookingService.js";

/*
=====================================================
Helpers
=====================================================
*/

const generateBookingNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "booking" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `BK-${String(counter.seq).padStart(6, "0")}`;
};

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

const bookingPopulate = [
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

const buildBookingItemsSnapshot = ({
  hotel,
  roomType,
  visa,
  trip,
  transport,
  data,
  pricingResult,
}) => {
  return {
    room: {
      roomTypeId: roomType?._id,
      roomNameAr: roomType?.nameAr || "",
      roomNameEn: roomType?.nameEn || "",

      hotelId: hotel?._id,
      hotelNameAr: hotel?.nameAr || "",
      hotelNameEn: hotel?.nameEn || "",

      checkIn: data.checkIn,
      checkOut: data.checkOut,

      price: pricingResult?.pricing?.roomPrice || 0,
    },

    visa: {
      visaId: visa?._id,
      visaNameAr: visa?.name?.ar || "",
      visaNameEn: visa?.name?.en || "",
      price: pricingResult?.pricing?.visaPrice || 0,
    },

    trip: {
      tripId: trip?._id,
      tripNameAr: trip?.nameAr || "",
      tripNameEn: trip?.nameEn || "",
      travelDate: data.travelDate,
      returnDate: data.returnDate,
      price: pricingResult?.pricing?.tripPrice || 0,
    },

    transport: {
      transportId: transport?._id,
      transportNameAr: transport?.nameAr || "",
      transportNameEn: transport?.nameEn || "",
      vehicleType: transport?.vehicleType || "",
      price: pricingResult?.pricing?.transportPrice || 0,
    },
  };
};

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
  const { skip, limit } = buildPagination(req.query);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate(bookingPopulate),

    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
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
  const { skip, limit } = buildPagination(req.query);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate(bookingPopulate),

    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    data: bookings,
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
    }),
  ).populate(bookingPopulate);

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
CREATE BOOKING
=====================================================
*/

export const createBooking = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const parsedData = safeJsonParse(req.body.data, req.body);

  const normalizedData = normalizeBooking({
    ...parsedData,
    user: parsedData.user || req.user?._id,
    createdBy: req.user?._id,
  });

  if (!normalizedData.user) {
    throw new AppError(
      isArabic ? "المستخدم مطلوب" : "User is required",
      400,
      "user",
    );
  }

  if (!normalizedData.pilgrims?.length) {
    throw new AppError(
      isArabic
        ? "يجب إضافة معتمر واحد على الأقل"
        : "At least one pilgrim is required",
      400,
      "pilgrims",
    );
  }

  await checkBookingAvailability({
    data: normalizedData,
    RoomType,
    Booking,
    Visa,
    Trip,
    Transport,
    req,
  });

  const pricingResult = await calculateFullBookingPricing({
    data: normalizedData,
    RoomType,
    Visa,
    Trip,
    Transport,
    req,
  });

  const hotel = normalizedData.hotel
    ? await Hotel.findById(normalizedData.hotel)
    : null;

  const bookingItems = buildBookingItemsSnapshot({
    hotel,
    roomType: pricingResult.docs.roomType,
    visa: pricingResult.docs.visa,
    trip: pricingResult.docs.trip,
    transport: pricingResult.docs.transport,
    data: normalizedData,
    pricingResult,
  });

  const bookingNumber = await generateBookingNumber();

  const paidAmount = pricingResult.payment.paidAmount || 0;
  const totalPrice = pricingResult.pricing.totalPrice || 0;

  const newBooking = await Booking.create({
    ...normalizedData,

    bookingNumber,

    hotel: normalizedData.hotel || hotel?._id,
    roomType: normalizedData.roomType,
    visa: normalizedData.visa,
    trip: normalizedData.trip,
    transport: normalizedData.transport,

    bookingItems,

    pricing: pricingResult.pricing,

    paidAmount,
    remainingAmount: Math.max(0, totalPrice - paidAmount),

    paymentStatus:
      paidAmount >= totalPrice && totalPrice > 0
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : "pending",

    bookingStatus: normalizedData.bookingStatus || "draft",

    createdBy: req.user?._id,
  });

  //مسارات Timeline الخاصة بالحجز.

  await logBookingCreated({
    BookingLog,
    booking: newBooking,
    req,
  });

  await sendInitialBookingNotification({
  booking: newBooking,
  req,
});

  await newBooking.populate(bookingPopulate);

  res.status(201).json({
    success: true,
    message: isArabic ? "تم إنشاء الحجز بنجاح" : "Booking created successfully",
    data: newBooking,
  });
});

/*
=====================================================
UPDATE BOOKING
=====================================================
*/

export const updateBooking = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  if (["cancelled", "completed"].includes(booking.bookingStatus)) {
    throw new AppError(
      isArabic
        ? "لا يمكن تعديل حجز ملغي أو مكتمل"
        : "Cannot update cancelled or completed booking",
      400,
      "bookingStatus",
    );
  }

  const parsedData = safeJsonParse(req.body.data, req.body);

  const normalizedData = normalizeBooking({
    ...parsedData,
    updatedBy: req.user?._id,
  });

  const mergedData = {
    ...booking.toObject(),
    ...normalizedData,
  };

  await checkBookingAvailability({
    data: mergedData,
    RoomType,
    Booking,
    Visa,
    Trip,
    Transport,
    req,
    excludeBookingId: booking._id,
  });

  const pricingResult = await calculateFullBookingPricing({
    data: mergedData,
    RoomType,
    Visa,
    Trip,
    Transport,
    req,
  });

  const hotel = mergedData.hotel
    ? await Hotel.findById(mergedData.hotel)
    : null;

  const bookingItems = buildBookingItemsSnapshot({
    hotel,
    roomType: pricingResult.docs.roomType,
    visa: pricingResult.docs.visa,
    trip: pricingResult.docs.trip,
    transport: pricingResult.docs.transport,
    data: mergedData,
    pricingResult,
  });
  //
  const oldValue = {
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    pricing: booking.pricing,
  };

  Object.assign(booking, {
    ...normalizedData,

    bookingItems,

    pricing: pricingResult.pricing,

    paidAmount: pricingResult.payment.paidAmount || booking.paidAmount || 0,

    remainingAmount:
      pricingResult.payment.remainingAmount ??
      Math.max(
        0,
        (pricingResult.pricing.totalPrice || 0) - (booking.paidAmount || 0),
      ),

    updatedBy: req.user?._id,
  });

  await booking.save();

  await logBookingUpdated({
    BookingLog,
    booking,
    oldValue,
    newValue: {
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      pricing: booking.pricing,
    },
    req,
  });

  await booking.populate(bookingPopulate);

  res.status(200).json({
    success: true,
    message: isArabic ? "تم تحديث الحجز بنجاح" : "Booking updated successfully",
    data: booking,
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

// export const deleteBooking = asyncHandler(async (req, res , next) => {
//   const isArabic = isArabicRequest(req);

//   const booking = await Booking.findById(req.params.id);

//   if (!booking) {
//     throw new AppError(
//       isArabic ? "الحجز غير موجود" : "Booking not found",
//       404,
//       "booking",
//     );
//   }

//   await booking.deleteOne();

//   res.status(200).json({
//     success: true,
//     message: isArabic ? "تم حذف الحجز بنجاح" : "Booking deleted successfully",
//   });
// });

/*
=====================================================
CANCEL BOOKING
=====================================================
*/

export const cancelBooking = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findById(req.params.id);

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

/*
=====================================================
PREVIEW BOOKING PRICE
=====================================================
*/

export const previewBookingPrice = asyncHandler(async (req, res) => {
  const parsedData = safeJsonParse(req.body.data, req.body);
  const normalizedData = normalizeBooking(parsedData);

  await checkBookingAvailability({
    data: normalizedData,
    RoomType,
    Booking,
    Visa,
    Trip,
    Transport,
    req,
  });

  const pricingResult = await calculateFullBookingPricing({
    data: normalizedData,
    RoomType,
    Visa,
    Trip,
    Transport,
    req,
  });

  res.status(200).json({
    success: true,
    data: pricingResult,
  });
});
