import Hotel from "../../models/hotels/hotel-model.js";
import RoomType from "../../models/hotels/roomType-model.js";
import Inventory from "../../models/inventory-model.js";
import AppError from "../../utils/AppError.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { calculateStayNights } from "../../utils/dates/calculateStayNights.js";
import { getPriceForDate } from "../pricing/priceEngine.js";
import { getInventoryAvailabilityByProduct } from "./inventory-availability-service.js";
import { isRoomSellableInPeriod } from "./room-sellability-policy.js";

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regex = (value) => new RegExp(escapeRegex(value), "i");

const positiveInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
};

const nonNegativeInteger = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
};

export const normalizeAccommodationSearchInput = (query = {}) => {
  const checkIn = query.checkIn || query.startDate || null;
  const checkOut = query.checkOut || query.endDate || null;
  const hasOneDate = Boolean(checkIn) !== Boolean(checkOut);
  const nights = checkIn && checkOut ? calculateStayNights(checkIn, checkOut) : 0;
  if (hasOneDate || (checkIn && nights < 1)) {
    throw new AppError("ACCOMMODATION_INVALID_DATES", 400, "checkOut");
  }

  const roomsCount = positiveInteger(query.roomsCount, 1);
  const adults = positiveInteger(query.adults, 1);
  const children = nonNegativeInteger(query.children, 0);
  if (String(query.roomsCount ?? "") !== "" && roomsCount !== Number(query.roomsCount)) {
    throw new AppError("INVALID_POSITIVE_INTEGER", 400, "roomsCount", { field: "roomsCount" });
  }
  if (String(query.adults ?? "") !== "" && adults !== Number(query.adults)) {
    throw new AppError("INVALID_POSITIVE_INTEGER", 400, "adults", { field: "adults" });
  }
  if (String(query.children ?? "") !== "" && children !== Number(query.children)) {
    throw new AppError("INVALID_NON_NEGATIVE_INTEGER", 400, "children", { field: "children" });
  }

  return {
    ...query,
    checkIn,
    checkOut,
    nights,
    roomsCount,
    adults,
    children,
    search: String(query.search || "").trim(),
    city: String(query.city || "").trim(),
    country: String(query.country || "").trim(),
    facilities: String(query.facilities || "").split(",").map((v) => v.trim()).filter(Boolean),
  };
};

export const evaluateRoomCapacity = ({ capacity = {}, roomsCount, adults, children }) => {
  const maxAdults = Math.max(0, Number(capacity.maxAdults || 0)) * roomsCount;
  const maxChildren = Math.max(0, Number(capacity.maxChildren || 0)) * roomsCount;
  const maxGuests = (Number(capacity.maxAdults || 0) + Number(capacity.maxChildren || 0)) * roomsCount;
  const requestedGuests = adults + children;
  return {
    fits: adults <= maxAdults && children <= maxChildren && requestedGuests <= maxGuests,
    requestedGuests,
    maxGuests,
    maxAdults,
    maxChildren,
  };
};

const buildHotelFilter = (input) => {
  const filter = { isActive: true, isDeleted: { $ne: true } };
  if (input.city) filter.$or = [
    { "location.city.ar": regex(input.city) },
    { "location.city.en": regex(input.city) },
  ];
  if (input.country) {
    filter.$and = [...(filter.$and || []), { $or: [
      { "location.country.ar": regex(input.country) },
      { "location.country.en": regex(input.country) },
      { "location.country.code": String(input.country).toUpperCase() },
    ] }];
  }
  if (input.stars) filter.stars = { $in: String(input.stars).split(",").map(Number).filter(Number.isFinite) };
  if (input.hotelType) filter.hotelType = input.hotelType;
  if (input.facilities.length) filter.facilities = { $all: input.facilities };
  return filter;
};

const publicHotelSelect = [
  "nameAr", "nameEn", "slug", "stars", "hotelType", "location.country",
  "location.city", "location.address", "images", "facilities",
  "policies.checkIn", "policies.checkOut",
].join(" ");

const publicRoomSelect = [
  "hotel", "nameAr", "nameEn", "descriptionAr", "descriptionEn", "images",
  "capacity", "totalOccupancy", "bedType", "mealPlan", "amenities",
  "pricing.basePrice", "pricing.currency", "pricing.pricingPeriods",
  "availability.availablePeriods", "isActive",
].join(" ");

const publicHotel = (hotel = {}) => ({
  _id: hotel._id,
  nameAr: hotel.nameAr || "",
  nameEn: hotel.nameEn || "",
  slug: hotel.slug || "",
  stars: Number(hotel.stars || 0),
  hotelType: hotel.hotelType || "hotel",
  location: hotel.location || {},
  images: hotel.images || [],
  facilities: hotel.facilities || [],
  policies: hotel.policies || {},
});

export const mapPublicAccommodationResult = ({ roomType, availability, input }) => {
  const price = Number(getPriceForDate(input.checkIn || new Date(), roomType.pricing).price || 0);
  return {
    _id: roomType._id,
    productId: roomType._id,
    type: "room",
    category: "roomTypes",
    roomTypeId: roomType._id,
    hotelId: roomType.hotel._id,
    nameAr: roomType.nameAr || "",
    nameEn: roomType.nameEn || "",
    descriptionAr: roomType.descriptionAr || "",
    descriptionEn: roomType.descriptionEn || "",
    images: roomType.images || [],
    capacity: roomType.capacity || {},
    totalOccupancy: roomType.totalOccupancy || 0,
    bedType: roomType.bedType || "",
    mealPlan: roomType.mealPlan || "",
    amenities: roomType.amenities || [],
    hotel: publicHotel(roomType.hotel),
    price,
    currency: roomType.pricing?.currency || "SAR",
    pricing: { basePrice: price, currency: roomType.pricing?.currency || "SAR", semantics: "NIGHTLY_PREVIEW" },
    availableCount: availability?.minAvailable ?? null,
    availability: {
      available: availability?.isAvailable ?? null,
      availableCount: availability?.minAvailable ?? null,
      requestedRooms: input.roomsCount,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: input.nights,
    },
  };
};

export const searchPublicAccommodations = async (query = {}) => {
  const input = normalizeAccommodationSearchInput(query);
  const hotelFilter = buildHotelFilter(input);
  const hotels = await Hotel.find(hotelFilter).select(publicHotelSelect).lean();
  const hotelIds = hotels.map(({ _id }) => _id);
  if (!hotelIds.length) {
    const { page, limit } = buildPagination(input);
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0, pages: 0 } };
  }

  const roomFilter = { hotel: { $in: hotelIds }, isActive: true, isDeleted: { $ne: true } };
  if (input.bedType) roomFilter.bedType = input.bedType;
  if (input.mealPlan) roomFilter.mealPlan = input.mealPlan;
  if (input.search) {
    const hotelMatches = hotels.filter((hotel) =>
      [hotel.nameAr, hotel.nameEn].some((value) => regex(input.search).test(String(value || ""))),
    ).map(({ _id }) => _id);
    roomFilter.$or = [
      { nameAr: regex(input.search) },
      { nameEn: regex(input.search) },
      { hotel: { $in: hotelMatches } },
    ];
  }

  const roomTypes = await RoomType.find(roomFilter)
    .select(publicRoomSelect)
    .lean();
  const hotelsById = new Map(hotels.map((hotel) => [String(hotel._id), hotel]));
  const roomTypesWithHotels = roomTypes.map((roomType) => ({
    ...roomType,
    hotel: hotelsById.get(String(roomType.hotel)) || null,
  }));
  const capacityEligible = roomTypesWithHotels.filter((roomType) =>
    roomType.hotel &&
    evaluateRoomCapacity({ ...input, capacity: roomType.capacity }).fits &&
    isRoomSellableInPeriod({
      roomType,
      startDate: input.checkIn,
      endDate: input.checkOut,
    }),
  );

  const availabilityById = input.checkIn
    ? await getInventoryAvailabilityByProduct({
        products: capacityEligible,
        Inventory,
        inventoryType: "roomType",
        startDate: input.checkIn,
        endDate: input.checkOut,
        requestedQuantity: input.roomsCount,
      })
    : new Map();

  let results = capacityEligible.filter((roomType) =>
    !input.checkIn || availabilityById.get(String(roomType._id))?.isAvailable,
  ).map((roomType) => mapPublicAccommodationResult({
    roomType,
    availability: availabilityById.get(String(roomType._id)),
    input,
  })).filter((item) =>
    (!input.minPrice || item.price >= Number(input.minPrice)) &&
    (!input.maxPrice || item.price <= Number(input.maxPrice)),
  );

  const sort = String(input.sort || "name_asc");
  const direction = sort.endsWith("_desc") ? -1 : 1;
  const field = sort.replace(/_(asc|desc)$/, "");
  results.sort((a, b) => {
    if (field === "price") return (a.price - b.price) * direction;
    if (field === "stars") return (a.hotel.stars - b.hotel.stars) * direction;
    return String(a.nameEn || a.nameAr).localeCompare(String(b.nameEn || b.nameAr)) * direction;
  });

  const { page, limit, skip } = buildPagination(input);
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  return {
    data: results.slice(skip, skip + limit),
    pagination: { page, limit, total, totalPages, pages: totalPages },
  };
};

export const assertAccommodationSelectionAvailable = async ({
  roomTypeId, checkIn, checkOut, roomsCount, adults, children,
  dependencies = {},
}) => {
  const RoomTypeModel = dependencies.RoomTypeModel || RoomType;
  const InventoryModel = dependencies.InventoryModel || Inventory;
  const input = normalizeAccommodationSearchInput({ checkIn, checkOut, roomsCount, adults, children });
  if (!input.checkIn) throw new AppError("ACCOMMODATION_INVALID_DATES", 400, "checkIn");
  const roomType = await RoomTypeModel.findOne({ _id: roomTypeId, isActive: true, isDeleted: { $ne: true } })
    .populate({ path: "hotel", match: { isActive: true, isDeleted: { $ne: true } }, select: "_id" })
    .select("hotel capacity availability.availablePeriods")
    .lean();
  if (!roomType?.hotel) throw new AppError("ACCOMMODATION_ROOM_TYPE_NOT_FOUND", 404, "hotel.roomTypeId");
  const capacity = evaluateRoomCapacity({ ...input, capacity: roomType.capacity });
  if (!capacity.fits) {
    throw new AppError("ACCOMMODATION_CAPACITY_EXCEEDED", 409, "hotel.adults", capacity);
  }
  if (!isRoomSellableInPeriod({
    roomType,
    startDate: input.checkIn,
    endDate: input.checkOut,
  })) {
    throw new AppError("ACCOMMODATION_NOT_AVAILABLE", 409, "hotel.checkIn");
  }
  const availability = (await getInventoryAvailabilityByProduct({
    products: [roomType], Inventory: InventoryModel, inventoryType: "roomType",
    startDate: input.checkIn, endDate: input.checkOut, requestedQuantity: input.roomsCount,
  })).get(String(roomType._id));
  if (!availability?.isAvailable) {
    throw new AppError("ACCOMMODATION_NOT_AVAILABLE", 409, "hotel.roomsCount", {
      requestedRooms: input.roomsCount,
      availableCount: availability?.minAvailable || 0,
    });
  }
  return availability;
};

export const assertDraftAccommodationAvailable = async (draft) => {
  if (
    draft?.bookingContext !== "SERVICE" ||
    !["ACCOMMODATION", "HOTEL"].includes(String(draft?.serviceType || "").toUpperCase())
  ) {
    return null;
  }

  return assertAccommodationSelectionAvailable({
    roomTypeId: draft.hotel?.roomTypeId,
    checkIn: draft.hotel?.checkIn,
    checkOut: draft.hotel?.checkOut,
    roomsCount: draft.hotel?.roomsCount,
    adults: draft.hotel?.adults,
    children: draft.hotel?.children,
  });
};
