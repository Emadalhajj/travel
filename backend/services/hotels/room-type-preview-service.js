import RoomType from "../../models/hotels/roomType-model.js";
import AppError from "../../utils/AppError.js";
import { calculateBookingPrice } from "../pricing/index.js";
import { checkAvailability } from "../booking/availability.js";

export const previewRoomTypeBookingPrice = async ({
  roomTypeId,
  checkIn,
  checkOut,
  adults = 1,
  children = 0,
  req,
}) => {
  if (!roomTypeId || !checkIn || !checkOut) {
    throw new AppError("REQUIRED_FIELDS_MISSING", 400, "roomTypeId");
  }

  const roomType = await RoomType.findOne({
    _id: roomTypeId,
    isActive: true,
    isDeleted: false,
  });
  if (!roomType) throw new AppError("ROOM_TYPE_NOT_FOUND", 404, "roomTypeId");

  const availability = await checkAvailability({
    roomTypeId,
    checkIn,
    checkOut,
    requestedRooms: 1,
    RoomType,
    req,
  });
  if (!availability.canBook) {
    const error = new AppError("ACCOMMODATION_NOT_AVAILABLE", 409, "checkIn");
    error.availability = availability;
    throw error;
  }

  return {
    availability,
    pricing: calculateBookingPrice({
      roomType,
      checkIn,
      checkOut,
      adults: Number(adults) || 1,
      children: Number(children) || 0,
    }),
  };
};
