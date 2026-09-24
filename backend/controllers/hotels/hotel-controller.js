import asyncHandler from "express-async-handler";
import Hotel from "../../models/hotels/hotel-model.js";
import AppError from "../../utils/AppError.js";
import { buildSearchQuery } from "../../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../../utils/Builders/buildSort.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { softDeleteDocument } from "../../utils/softDelete.js";
import { createAuditLog } from "../../services/audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { createHotelService, updateHotelService } from "../../services/hotels/hotel-service.js";

export const getAllHotels = asyncHandler(async (req, res) => {
  const { search, city, stars, isActive, hotelType } = req.query;
  const filter = { isDeleted: false, ...buildSearchQuery({ search, searchFields: ["nameEn", "nameAr", "descriptionEn", "descriptionAr"] }) };
  if (city) filter["location.city.en"] = city;
  if (stars) filter.stars = Number(stars);
  if (hotelType) filter.hotelType = hotelType;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const { page, skip, limit } = buildPagination(req.query);
  const [hotels, total] = await Promise.all([
    Hotel.find(filter).sort(buildSort(req.query)).skip(skip).limit(limit).populate("roomTypes", "nameAr nameEn"),
    Hotel.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, total, page, limit, hotels });
});

export const getHotelById = asyncHandler(async (req, res) => {
  const oneHotel = await Hotel.findOne({ _id: req.params.id, isDeleted: false }).populate("roomTypes", "nameAr nameEn");
  if (!oneHotel) throw new AppError("HOTEL_NOT_FOUND", 404, "hotel");
  res.status(200).json({ success: true, oneHotel });
});

export const createHotel = asyncHandler(async (req, res) => {
  const hotel = await createHotelService({ data: req.body, actorId: req.user?._id, isArabic: isArabicRequest(req) });
  res.status(201).json({ success: true, hotel });
});

export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await updateHotelService({ hotelId: req.params.id, data: req.body, actorId: req.user?._id, isArabic: isArabicRequest(req) });
  res.status(200).json({ success: true, upHotel: hotel });
});

export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, isDeleted: false });
  if (!hotel) throw new AppError("HOTEL_NOT_FOUND", 404, "hotel");
  const before = hotel.toObject();
  await softDeleteDocument({ document: hotel, userId: req.user?._id });
  await createAuditLog({ req, action: AUDIT_ACTIONS.DELETE, entity: AUDIT_ENTITIES.HOTEL, entityId: hotel._id, before, after: hotel.toObject(), metadata: { module: "hotels", softDelete: true } });
  res.status(200).json({ success: true, message: "تم الحذف بنجاح" });
});

export const toggleHotelStatus = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, isDeleted: false });
  if (!hotel) throw new AppError("HOTEL_NOT_FOUND", 404, "hotel");
  const before = hotel.toObject(); hotel.isActive = !hotel.isActive; hotel.updatedBy = req.user?._id || null; await hotel.save();
  await createAuditLog({ req, action: AUDIT_ACTIONS.STATUS_CHANGE, entity: AUDIT_ENTITIES.HOTEL, entityId: hotel._id, before, after: hotel.toObject(), metadata: { module: "hotels" } });
  res.status(200).json({ success: true, message: "تم التغيير بنجاح", hotel });
});
