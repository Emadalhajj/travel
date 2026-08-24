// services/booking/availability.js

import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import Inventory from "../../models/inventory-model.js";
import { checkInventoryForWholePeriod } from "../availability/inventory-availability-service.js";

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
  req = null,
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

  const inventoryAvailability = await checkInventoryForWholePeriod({
    Inventory,
    inventoryType: "roomType",
    itemId: roomType._id,
    startDate: checkInDate,
    endDate: checkOutDate,
    requestedQuantity: requestedRooms,
  });
  const available = inventoryAvailability.minAvailable;
  const canBook = inventoryAvailability.isAvailable;

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
    totalRooms: Number(roomType.totalRooms) || 0,
    bookedCount: null,
    available,
    requestedRooms: Number(requestedRooms) || 1,
    canBook,
    occupancyRate: null,
    availabilityReason: inventoryAvailability.reason,
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
  startDate,
  endDate,
  requestedQuantity = 1,
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

  if (visa.isAlwaysAvailable !== true) {
    const availability = await checkInventoryForWholePeriod({
      Inventory,
      inventoryType: "visa",
      itemId: visa._id,
      startDate,
      endDate,
      requestedQuantity,
    });
    if (!availability.isAvailable) {
      throw new AppError(
        isArabic ? "هذه التأشيرة غير متاحة خلال الفترة المطلوبة" : "Visa is unavailable for the requested period",
        400,
        "visa",
      );
    }
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
  startDate,
  endDate,
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

  const inventoryStart = normalizeDate(startDate || trip.startDate);
  const inventoryEnd = normalizeDate(endDate) || (
    inventoryStart
      ? new Date(inventoryStart.getFullYear(), inventoryStart.getMonth(), inventoryStart.getDate() + 1)
      : null
  );
  const availability = await checkInventoryForWholePeriod({
    Inventory,
    inventoryType: "trip",
    itemId: trip._id,
    startDate: inventoryStart,
    endDate: inventoryEnd,
    requestedQuantity: pilgrimsCount,
  });

  if (!availability.isAvailable) {
    throw new AppError(
      isArabic
        ? "الرحلة غير متاحة خلال الفترة المطلوبة"
        : "Trip is unavailable for the requested period",
      400,
      "trip",
    );
  }

  return {
    canBook: true,
    trip,
    availableSeats: availability.minAvailable,
    requestedSeats: pilgrimsCount,
    availabilityReason: availability.reason,
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
  startDate,
  endDate,
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

  if (transport.isAlwaysAvailable !== true) {
    const availability = await checkInventoryForWholePeriod({
      Inventory,
      inventoryType: "transport",
      itemId: transport._id,
      startDate,
      endDate,
      requestedQuantity: 1,
    });
    if (!availability.isAvailable) {
      throw new AppError(
        isArabic ? "وسيلة النقل غير متاحة خلال الفترة المطلوبة" : "Transport is unavailable for the requested period",
        400,
        "transport",
      );
    }
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
  const availabilityStart =
    data.checkIn || data.startDate || data.travelDate || data.program?.startDate;
  const availabilityEnd =
    data.checkOut || data.endDate || data.returnDate || data.program?.endDate;

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
      startDate: availabilityStart,
      endDate: availabilityEnd,
      requestedQuantity: pilgrimsCount,
      req,
    });
  }

  if (data.trip) {
    result.trip = await checkTripAvailability({
      tripId: data.trip,
      pilgrimsCount,
      Trip,
      startDate: availabilityStart,
      endDate: availabilityEnd,
      req,
    });
  }

  if (data.transport) {
    result.transport = await checkTransportAvailability({
      transportId: data.transport,
      pilgrimsCount,
      Transport,
      startDate: availabilityStart,
      endDate: availabilityEnd,
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
