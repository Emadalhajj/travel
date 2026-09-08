// services/booking/availability.js

import AppError from "../../utils/AppError.js";
import Inventory from "../../models/inventory-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import { checkInventoryForWholePeriod } from "../availability/inventory-availability-service.js";
import { normalizeInventoryDate } from "./inventory-service.js";

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
  const roomType = await RoomType.findById(roomTypeId);

  if (!roomType) {
    throw new AppError(
      "ROOM_TYPE_NOT_FOUND",
      404,
      "roomType",
    );
  }

  const checkInDate = normalizeDate(checkIn);
  const checkOutDate = normalizeDate(checkOut);

  if (!checkInDate || !checkOutDate) {
    throw new AppError(
      "BOOKING_DATES_INVALID",
      400,
      "checkIn",
    );
  }

  if (checkOutDate <= checkInDate) {
    throw new AppError(
      "CHECKOUT_BEFORE_CHECKIN",
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
      "ROOM_CAPACITY_UNAVAILABLE",
      400,
      "requestedRooms",
      { available },
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

  if (!visaId) {
    return {
      canBook: true,
      visa: null,
    };
  }

  const visa = await Visa.findById(visaId);

  if (!visa) {
    throw new AppError(
      "VISA_NOT_FOUND",
      404,
      "visa",
    );
  }

  if (!visa.isActive) {
    throw new AppError("VISA_INACTIVE",
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
        "VISA_UNAVAILABLE",
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
  departureId,
  pilgrimsCount = 1,
  Trip,
  req = null,
}) => {

  if (!tripId && !departureId) {
    return {
      canBook: true,
      trip: null,
    };
  }

  if (!tripId || !departureId) {
    throw new AppError(
      "TRIP_DEPARTURE_DATA_INCOMPLETE",
      400,
      "tripDeparture",
    );
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND",
      404,
      "trip",
    );
  }

  if (!trip.isActive) {
    throw new AppError("TRIP_INACTIVE",
      400,
      "trip",
    );
  }

  const departure = await TripDeparture.findOne({
    _id: departureId,
    tripId: trip._id,
    status: "SCHEDULED",
    isActive: true,
    isDeleted: false,
    departureAt: { $gt: new Date() },
  }).lean();

  if (!departure) {
    throw new AppError(
      "TRIP_DEPARTURE_NOT_AVAILABLE",
      400,
      "tripDeparture",
      { id: departureId },
    );
  }

  const requestedSeats = Math.max(Number(pilgrimsCount) || 1, 1);
  const inventory = await Inventory.findOne({
    inventoryType: "tripDeparture",
    itemId: departure._id,
    date: normalizeInventoryDate(departure.departureAt),
    isActive: true,
    isDeleted: false,
    available: { $gte: requestedSeats },
  });

  if (!inventory) {
    throw new AppError(
      "TRIP_UNAVAILABLE",
      400,
      "trip",
    );
  }

  return {
    canBook: true,
    trip,
    departure,
    availableSeats: Number(inventory.available || 0),
    requestedSeats,
    availabilityReason: "available",
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

  if (!transportId) {
    return {
      canBook: true,
      transport: null,
    };
  }

  const transport = await Transport.findById(transportId);

  if (!transport) {
    throw new AppError(
      "TRANSPORT_NOT_FOUND",
      404,
      "transport",
    );
  }

  if (!transport.isActive) {
    throw new AppError("TRANSPORT_INACTIVE",
      400,
      "transport",
    );
  }

  const capacity = Number(transport.capacity) || 0;

  if (capacity > 0 && capacity < pilgrimsCount) {
    throw new AppError(
      "TRANSPORT_CAPACITY_INSUFFICIENT",
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
        "TRANSPORT_UNAVAILABLE",
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
      departureId: data.tripDeparture || data.bookingItems?.trip?.departureId,
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
