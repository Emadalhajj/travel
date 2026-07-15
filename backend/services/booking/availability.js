// services/booking/availability.js

import AppError from "../../utils/AppError.js";
import { roundPrice } from "../../utils/roundPrice.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

/*
=====================================================
Helpers
=====================================================
*/

// ✅ توحيد التاريخ بدون UTC لتجنب اختلاف اليوم
export const normalizeDate = (d) => {
  if (!d) return null;

  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
};

export const datesOverlap = ({
  startA,
  endA,
  startB,
  endB,
}) => {
  return startA < endB && endA > startB;
};

const getLanguage = (req) => {
  return req ? isArabicRequest(req) : true;
};

const isValidObject = (doc) => {
  return !!doc;
};

/*
=====================================================
Room Availability
=====================================================

يتحقق من توفر نوع الغرفة حسب:
- roomTypeId
- checkIn
- checkOut
- requestedRooms

يعتمد على:
- RoomType.totalRooms
- Booking.roomType
- Booking.checkIn / checkOut
- Booking.bookingStatus
*/

export const checkRoomAvailability = async ({
  roomTypeId,
  checkIn,
  checkOut,
  requestedRooms = 1,
  RoomType,
  Booking,
  req = null,
  excludeBookingId = null,
}) => {
  const isArabic = getLanguage(req);

  const roomType = await RoomType.findById(roomTypeId);

  if (!roomType) {
    throw new AppError(
      isArabic ? "نوع الغرفة غير موجود" : "Room type not found",
      404,
      "roomType",
    );
  }

  const totalRooms = Number(roomType.totalRooms) || 0;

  const checkInDate = normalizeDate(checkIn);
  const checkOutDate = normalizeDate(checkOut);

  if (!checkInDate || !checkOutDate) {
    throw new AppError(
      isArabic ? "تواريخ الحجز غير صحيحة" : "Invalid booking dates",
      400,
      "checkIn",
    );
  }

  if (checkOutDate <= checkInDate) {
    throw new AppError(
      isArabic
        ? "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول"
        : "Checkout date must be after check-in date",
      400,
      "checkOut",
    );
  }

  const filter = {
    roomType: roomType._id,

    bookingStatus: {
      $nin: ["cancelled"],
    },
  };

  if (excludeBookingId) {
    filter._id = {
      $ne: excludeBookingId,
    };
  }

  const bookings = await Booking.find(filter)
    .select("checkIn checkOut reservedRooms bookingStatus")
    .lean();

  const bookedCount = bookings
    .filter((booking) => {
      const bookedCheckIn = normalizeDate(booking.checkIn);
      const bookedCheckOut = normalizeDate(booking.checkOut);

      if (!bookedCheckIn || !bookedCheckOut) return false;

      return datesOverlap({
        startA: bookedCheckIn,
        endA: bookedCheckOut,
        startB: checkInDate,
        endB: checkOutDate,
      });
    })
    .reduce((sum, booking) => {
      return sum + (Number(booking.reservedRooms) || 1);
    }, 0);

  const available = Math.max(0, totalRooms - bookedCount);

  const canBook =
    available >= Number(requestedRooms || 1);

  if (!canBook) {
    throw new AppError(
      isArabic
        ? `المتاح فقط ${available} ${available === 1 ? "غرفة" : "غرف"}`
        : `Only ${available} room${available === 1 ? "" : "s"} available`,
      400,
      "requestedRooms",
    );
  }

  return {
    roomTypeId: roomType._id,
    totalRooms,
    bookedCount,
    available,
    requestedRooms: Number(requestedRooms) || 1,
    canBook,
    occupancyRate: roundPrice(
      totalRooms > 0
        ? (bookedCount / totalRooms) * 100
        : 0,
    ),
  };
};

/*
=====================================================
Visa Availability
=====================================================

حالياً التأشيرة عندك لا تحتوي مخزون رقمي.
لذلك التحقق يكون:
- التأشيرة موجودة
- التأشيرة مفعلة

لاحقاً إذا أضفت حقل stock أو quota يمكن تطويرها.
*/

export const checkVisaAvailability = async ({
  visaId,
  Visa,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!visaId) {
    return {
      canBook: true,
      visa: null,
    };
  }

  const visa = await Visa.findById(visaId);

  if (!visa) {
    throw new AppError(
      isArabic ? "التأشيرة غير موجودة" : "Visa not found",
      404,
      "visa",
    );
  }

  if (!visa.isActive) {
    throw new AppError(
      isArabic
        ? "هذه التأشيرة غير متاحة حالياً"
        : "This visa is currently unavailable",
      400,
      "visa",
    );
  }

  return {
    canBook: true,
    visa,
  };
};

/*
=====================================================
Trip Availability
=====================================================

يتحقق من:
- وجود الرحلة
- أنها مفعلة
- المقاعد المتاحة إن وجدت
*/

export const checkTripAvailability = async ({
  tripId,
  pilgrimsCount = 1,
  Trip,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!tripId) {
    return {
      canBook: true,
      trip: null,
    };
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    throw new AppError(
      isArabic ? "الرحلة غير موجودة" : "Trip not found",
      404,
      "trip",
    );
  }

  if (!trip.isActive) {
    throw new AppError(
      isArabic
        ? "هذه الرحلة غير متاحة حالياً"
        : "This trip is currently unavailable",
      400,
      "trip",
    );
  }

  const availableSeats =
    Number(trip.capacity?.availableSeats) || 0;

  const totalSeats =
    Number(trip.capacity?.totalSeats) || 0;

  // إذا لم يتم ضبط المقاعد في الرحلة، نسمح بالحجز
  if (totalSeats > 0 && availableSeats < pilgrimsCount) {
    throw new AppError(
      isArabic
        ? `المقاعد المتاحة فقط ${availableSeats}`
        : `Only ${availableSeats} seats available`,
      400,
      "trip",
    );
  }

  return {
    canBook: true,
    trip,
    totalSeats,
    availableSeats,
    requestedSeats: pilgrimsCount,
  };
};

/*
=====================================================
Transport Availability
=====================================================

Transport عندك حالياً يمثل نوع مركبة/وسيلة نقل.
لا يوجد مخزون زمني أو عدد مركبات.

لذلك التحقق الحالي:
- موجود
- مفعل
- السعة تكفي عدد المعتمرين إن كانت موجودة
*/

export const checkTransportAvailability = async ({
  transportId,
  pilgrimsCount = 1,
  Transport,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!transportId) {
    return {
      canBook: true,
      transport: null,
    };
  }

  const transport = await Transport.findById(transportId);

  if (!transport) {
    throw new AppError(
      isArabic ? "وسيلة النقل غير موجودة" : "Transport not found",
      404,
      "transport",
    );
  }

  if (!transport.isActive) {
    throw new AppError(
      isArabic
        ? "وسيلة النقل غير متاحة حالياً"
        : "Transport is currently unavailable",
      400,
      "transport",
    );
  }

  const capacity = Number(transport.capacity) || 0;

  if (capacity > 0 && capacity < pilgrimsCount) {
    throw new AppError(
      isArabic
        ? `سعة وسيلة النقل لا تكفي عدد المعتمرين`
        : `Transport capacity is not enough`,
      400,
      "transport",
    );
  }

  return {
    canBook: true,
    transport,
    capacity,
    requestedSeats: pilgrimsCount,
  };
};

/*
=====================================================
Full Booking Availability
=====================================================

هذه الدالة تستخدم داخل booking-controller قبل إنشاء الحجز.

تتحقق من:
- الغرفة
- التأشيرة
- الرحلة
- النقل
*/

export const checkBookingAvailability = async ({
  data,

  RoomType,
  Booking,
  Visa,
  Trip,
  Transport,

  req = null,
  excludeBookingId = null,
}) => {
  const pilgrimsCount =
    Array.isArray(data.pilgrims) && data.pilgrims.length > 0
      ? data.pilgrims.length
      : 1;

  const result = {
    room: null,
    visa: null,
    trip: null,
    transport: null,
    canBook: true,
  };

  if (data.roomType && data.checkIn && data.checkOut) {
    result.room = await checkRoomAvailability({
      roomTypeId: data.roomType,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      requestedRooms: data.reservedRooms || 1,
      RoomType,
      Booking,
      req,
      excludeBookingId,
    });
  }

  if (data.visa) {
    result.visa = await checkVisaAvailability({
      visaId: data.visa,
      Visa,
      req,
    });
  }

  if (data.trip) {
    result.trip = await checkTripAvailability({
      tripId: data.trip,
      pilgrimsCount,
      Trip,
      req,
    });
  }

  if (data.transport) {
    result.transport = await checkTransportAvailability({
      transportId: data.transport,
      pilgrimsCount,
      Transport,
      req,
    });
  }

  return result;
};

/*
=====================================================
Backward Compatibility
=====================================================

حتى لا ينكسر الكود القديم الذي يستدعي:
checkAvailability()

مثل previewBookingPrice في roomType-controller
*/

export const checkAvailability = checkRoomAvailability;