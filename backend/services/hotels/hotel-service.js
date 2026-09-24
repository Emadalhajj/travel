import Hotel from "../../models/hotels/hotel-model.js";
import AppError from "../../utils/AppError.js";
import { normalizeString } from "../../utils/generic/normalizeString.js";
import { normalizeArray } from "../../utils/generic/normalizeArray.js";
import { validateUniqueFields } from "../../validators/validateUniqueFields.js";
import { deleteImagesFromDisk, deleteAttachmentsFromDisk } from "../../utils/imageManager.js";
import { createAuditLog } from "../audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

const auditReq = (actorId) => actorId ? { user: { _id: actorId }, headers: {} } : null;
const urls = (items) => normalizeArray(items).map((item) => item?.url || item).filter(Boolean);
const attachmentDownloadUrl = (hotelId, attachmentId) =>
  `/api/private-files/hotels/${hotelId}/${attachmentId}`;

const assignPrivateAttachmentUrls = (hotel) => {
  for (const attachment of hotel.attachments || []) {
    attachment.url = attachmentDownloadUrl(hotel._id, attachment._id);
  }
};
const normalizeHotel = (data = {}) => ({
  ...data,
  nameAr: normalizeString(data.nameAr),
  nameEn: normalizeString(data.nameEn),
  contact: data.contact ? Object.fromEntries(Object.entries(data.contact).map(([k, v]) => [k, String(v || "").trim()])) : undefined,
  facilities: normalizeArray(data.facilities).filter(Boolean),
  roomTypes: normalizeArray(data.roomTypes).filter(Boolean),
  location: data.location ? { ...data.location, coordinates: data.location.coordinates ? {
    lat: data.location.coordinates.lat || undefined,
    lng: data.location.coordinates.lng || undefined,
  } : undefined } : undefined,
});

const assertUniqueHotel = ({ data, excludeId, isArabic }) => validateUniqueFields({
  Model: Hotel,
  query: { $or: [{ nameEn: normalizeString(data.nameEn) }, { nameAr: normalizeString(data.nameAr) }] },
  excludeId,
  message: isArabic ? "اسم الفندق موجود مسبقًا" : "Hotel name already exists",
});

export const createHotelService = async ({ data, actorId, isArabic = true }) => {
  await assertUniqueHotel({ data, isArabic });
  const normalized = normalizeHotel(data);
  const hotel = await Hotel.create({
    ...normalized,
    images: urls(data.newImages),
    attachments: normalizeArray(data.newAttachments),
    createdBy: actorId || null,
  });
  assignPrivateAttachmentUrls(hotel);
  await hotel.save();
  await createAuditLog({ req: auditReq(actorId), action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.HOTEL, entityId: hotel._id, after: hotel.toObject(), metadata: { module: "hotels" } });
  return hotel;
};

export const updateHotelService = async ({ hotelId, data, actorId, isArabic = true }) => {
  const hotel = await Hotel.findOne({ _id: hotelId, isDeleted: false });
  if (!hotel) throw new AppError("HOTEL_NOT_FOUND", 404, "hotel");
  await assertUniqueHotel({ data: { ...hotel.toObject(), ...data }, excludeId: hotelId, isArabic });
  const before = hotel.toObject();
  const deleteImages = urls(data.deleteImages);
  const deleteAttachments = urls(data.deleteAttachments);
  if (deleteImages.length) await deleteImagesFromDisk(deleteImages);
  if (deleteAttachments.length) await deleteAttachmentsFromDisk(deleteAttachments);
  const keptImages = (hotel.images || []).filter((url) => !deleteImages.includes(url));
  const keptAttachments = (hotel.attachments || []).filter((item) => !deleteAttachments.includes(item.url));
  const normalized = normalizeHotel(data);
  delete normalized.newImages; delete normalized.newAttachments;
  delete normalized.deleteImages; delete normalized.deleteAttachments;
  Object.assign(hotel, normalized, {
    images: [...keptImages, ...urls(data.newImages)],
    attachments: [...keptAttachments, ...normalizeArray(data.newAttachments)],
    updatedBy: actorId || null,
  });
  assignPrivateAttachmentUrls(hotel);
  await hotel.save();
  await createAuditLog({ req: auditReq(actorId), action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.HOTEL, entityId: hotel._id, before, after: hotel.toObject(), metadata: { module: "hotels" } });
  return hotel;
};
