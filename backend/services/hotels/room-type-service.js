import RoomType from "../../models/hotels/roomType-model.js";
import Hotel from "../../models/hotels/hotel-model.js";
import AppError from "../../utils/AppError.js";
import { normalizeString } from "../../utils/generic/normalizeString.js";
import { normalizeArray } from "../../utils/generic/normalizeArray.js";
import { normalizeBoolean } from "../../utils/generic/normalizeBoolean.js";
import { validateUniqueFields } from "../../validators/validateUniqueFields.js";
import { validatePricingPeriods } from "../validators/roomType-validation.js";
import { deleteImagesFromDisk } from "../../utils/imageManager.js";
import { createAuditLog } from "../audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

const auditReq = (actorId) => actorId ? { user: { _id: actorId }, headers: {} } : null;
const optionalNumber = (v) => v === "" || v == null ? undefined : Number(v);
const urls = (items) => normalizeArray(items).map((item) => item?.url || item).filter(Boolean);
const normalizePeriods = (items = []) => normalizeArray(items).map((p) => ({ ...p,
  nameAr: normalizeString(p.nameAr), nameEn: normalizeString(p.nameEn), days: normalizeArray(p.days),
  price: Number(p.price) || 0, priority: Number(p.priority) || 0, isActive: normalizeBoolean(p.isActive),
}));
const normalizeRoom = (data, current = {}) => ({
  ...data,
  hotel: data.hotel || current.hotel,
  nameAr: normalizeString(data.nameAr), nameEn: normalizeString(data.nameEn),
  descriptionAr: normalizeString(data.descriptionAr), descriptionEn: normalizeString(data.descriptionEn),
  capacity: { maxAdults: Math.max(1, Number(data.capacity?.maxAdults) || 2), maxChildren: Math.max(0, Number(data.capacity?.maxChildren) || 0) },
  pricing: { basePrice: Math.max(0, Number(data.pricing?.basePrice) || 0), weekendPrice: optionalNumber(data.pricing?.weekendPrice),
    currency: data.pricing?.currency || "SAR", discountPercent: Math.min(100, Math.max(0, Number(data.pricing?.discountPercent) || 0)),
    pricingPeriods: normalizePeriods(data.pricing?.pricingPeriods) },
  size: optionalNumber(data.size), totalRooms: Math.max(1, Number(data.totalRooms) || 1),
  bedType: data.bedType || current.bedType || "quad", mealPlan: data.mealPlan || current.mealPlan || "room_only",
  amenities: normalizeArray(data.amenities), isActive: normalizeBoolean(data.isActive),
  availability: { availablePeriods: normalizeArray(data.availability?.availablePeriods).map((p) => ({ ...p, isActive: normalizeBoolean(p.isActive) })) },
});
const validateDomain = async ({ data, excludeId, isArabic }) => {
  const hotel = await Hotel.findOne({ _id: data.hotel, isDeleted: false });
  if (!hotel) throw new AppError("HOTEL_NOT_FOUND", 404, "hotel");
  const errors = validatePricingPeriods(data.pricing?.pricingPeriods || [], isArabic);
  if (errors.length) { const error = new AppError("PRICING_PERIODS_INVALID", 400, "pricing.pricingPeriods"); error.errors = errors; throw error; }
  await validateUniqueFields({ Model: RoomType, query: { hotel: data.hotel, $or: [{ nameEn: data.nameEn }, { nameAr: data.nameAr }] },
    excludeId, message: isArabic ? "نوع الغرفة موجود مسبقًا في هذا الفندق" : "Room type already exists in this hotel" });
};
const populateActors = (room) => room.populate([{ path: "createdBy", select: "name nameAr nameEn email username" }, { path: "updatedBy", select: "name nameAr nameEn email username" }]);

export const createRoomTypeService = async ({ data, actorId, isArabic = true }) => {
  const normalized = normalizeRoom(data);
  await validateDomain({ data: normalized, isArabic });
  const room = await RoomType.create({ ...normalized, images: urls(data.newImages), createdBy: actorId || null });
  await createAuditLog({ req: auditReq(actorId), action: AUDIT_ACTIONS.CREATE, entity: AUDIT_ENTITIES.ROOM_TYPE,
    entityId: room._id, after: room.toObject(), metadata: { module: "room_types" } });
  await populateActors(room); return room;
};

export const updateRoomTypeService = async ({ roomTypeId, data, actorId, isArabic = true }) => {
  const room = await RoomType.findOne({ _id: roomTypeId, isDeleted: false });
  if (!room) throw new AppError("ROOM_TYPE_NOT_FOUND", 404, "roomType");
  const normalized = normalizeRoom(data, room);
  await validateDomain({ data: normalized, excludeId: roomTypeId, isArabic });
  const before = room.toObject(); const deleted = urls(data.deleteImages);
  if (deleted.length) await deleteImagesFromDisk(deleted);
  delete normalized.newImages; delete normalized.deleteImages;
  Object.assign(room, normalized, { images: [...(room.images || []).filter((url) => !deleted.includes(url)), ...urls(data.newImages)], updatedBy: actorId || null });
  await room.save();
  await createAuditLog({ req: auditReq(actorId), action: AUDIT_ACTIONS.UPDATE, entity: AUDIT_ENTITIES.ROOM_TYPE,
    entityId: room._id, before, after: room.toObject(), metadata: { module: "room_types" } });
  await populateActors(room); return room;
};
