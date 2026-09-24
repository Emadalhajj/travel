import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import RoomType from "../../models/hotels/roomType-model.js";
import AppError from "../../utils/AppError.js";
import { buildSearchQuery } from "../../utils/Builders/buildSearchQuery.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { softDeleteDocument } from "../../utils/softDelete.js";
import { createAuditLog } from "../../services/audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { previewRoomTypeBookingPrice } from "../../services/hotels/room-type-preview-service.js";
import { createRoomTypeService, updateRoomTypeService } from "../../services/hotels/room-type-service.js";
import { buildProductSort } from "../../utils/buildProductSort.js";

export const getAllRoomType = asyncHandler(async (req, res) => {
  const { search, isActive, bedType } = req.query;
  const filter = { isDeleted: false, ...buildSearchQuery({ search, searchFields: ["nameAr", "nameEn", "descriptionAr", "descriptionEn"] }) };
  if (bedType) filter.bedType = bedType;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const { page, skip, limit } = buildPagination(req.query);
  const sort = buildProductSort({ value: req.query.sort, priceField: "pricing.basePrice" });
  const [roomTypes, total] = await Promise.all([
    RoomType.find(filter).sort(sort).skip(skip).limit(limit).populate("hotel", "nameAr nameEn location.city").populate("createdBy", "name email").populate("updatedBy", "name email"),
    RoomType.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, total, page, limit, roomTypes });
});

export const getRoomTypeById = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findOne({ _id: req.params.id, isDeleted: false }).populate("hotel", "nameAr nameEn location.city");
  if (!roomType) throw new AppError("ROOM_TYPE_NOT_FOUND", 404, "roomType");
  const finalPrice = roomType.computedFinalPrice || roomType.pricing?.finalPrice || 0;
  res.status(200).json({ success: true, data: roomType, computed: { totalOccupancy: roomType.totalOccupancy, finalPrice, savings: (roomType.pricing?.basePrice || 0) - finalPrice, occupancyRate: roomType.totalRooms > 0 ? 100 : 0 } });
});

export const getRoomTypesByHotelId = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.hotelId)) throw new AppError("INVALID_LOOKUP_ID", 400, "hotelId");
  const data = await RoomType.find({ hotel: req.params.hotelId, isDeleted: false }).populate("hotel", "nameAr nameEn").sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: data.length, data });
});

export const previewBookingPrice = asyncHandler(async (req, res) => {
  const data = await previewRoomTypeBookingPrice({ ...req.body, req });
  res.status(200).json({ success: true, data });
});

export const createRoomType = asyncHandler(async (req, res) => {
  const data = await createRoomTypeService({ data: req.body, actorId: req.user?._id, isArabic: isArabicRequest(req) });
  res.status(201).json({ success: true, message: "تم إنشاء نوع الغرفة بنجاح", data });
});

export const updateRoomType = asyncHandler(async (req, res) => {
  const data = await updateRoomTypeService({ roomTypeId: req.params.id, data: req.body, actorId: req.user?._id, isArabic: isArabicRequest(req) });
  res.status(200).json({ success: true, message: isArabicRequest(req) ? "تم تحديث نوع الغرفة بنجاح" : "Room type updated successfully", data });
});

export const deleteRoomType = asyncHandler(async (req, res) => {
  const room = await RoomType.findOne({ _id: req.params.id, isDeleted: false });
  if (!room) throw new AppError("ROOM_TYPE_NOT_FOUND", 404, "roomType");
  const before = room.toObject(); await softDeleteDocument({ document: room, userId: req.user?._id });
  await createAuditLog({ req, action: AUDIT_ACTIONS.DELETE, entity: AUDIT_ENTITIES.ROOM_TYPE, entityId: room._id, before, after: room.toObject(), metadata: { module: "room_types", softDelete: true } });
  res.status(200).json({ success: true, message: "تم الحذف بنجاح" });
});

export const toggleRoomTypeStatus = asyncHandler(async (req, res) => {
  const room = await RoomType.findOne({ _id: req.params.id, isDeleted: false });
  if (!room) throw new AppError("ROOM_TYPE_NOT_FOUND", 404, "roomType");
  const before = room.toObject(); room.isActive = !room.isActive; room.updatedBy = req.user?._id || null; await room.save();
  await createAuditLog({ req, action: AUDIT_ACTIONS.STATUS_CHANGE, entity: AUDIT_ENTITIES.ROOM_TYPE, entityId: room._id, before, after: room.toObject(), metadata: { module: "room_types" } });
  res.status(200).json({ success: true, data: room, message: room.isActive ? "Successfully activated" : "Successfully deactivated" });
});
