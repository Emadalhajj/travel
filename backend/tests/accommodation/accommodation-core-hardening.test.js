import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import Hotel from "../../models/hotels/hotel-model.js";
import RoomType from "../../models/hotels/roomType-model.js";
import { createHotelSchema } from "../../services/validators/hotel-validation.js";
import { createRoomTypeSchema } from "../../services/validators/roomType-validation.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("RoomType has one size and bedType path and deterministic occupancy fields", () => {
  assert.equal(RoomType.schema.path("size").instance, "Number");
  assert.equal(RoomType.schema.path("bedType").instance, "String");
  assert.equal(RoomType.schema.path("capacity.maxAdults").instance, "Number");
  assert.equal(RoomType.schema.path("capacity.maxChildren").instance, "Number");
  assert.equal(RoomType.schema.path("capacity.maxOccupancy").instance, "Number");
  assert.equal(RoomType.schema.path("totalOccupancy").instance, "Number");
});

test("RoomType pricing schema explicitly supports legacy caches and weekend price", () => {
  assert.equal(RoomType.schema.path("pricing.basePrice").instance, "Number");
  assert.equal(RoomType.schema.path("pricing.weekendPrice").instance, "Number");
  assert.equal(RoomType.schema.path("pricing.finalPrice").instance, "Number");
  assert.ok(RoomType.schema.path("pricing.pricingPeriods"));
});

test("Hotel and RoomType share the project soft-delete contract", () => {
  for (const model of [Hotel, RoomType]) {
    assert.equal(model.schema.path("isDeleted").instance, "Boolean");
    assert.equal(model.schema.path("deletedAt").instance, "Date");
    assert.equal(model.schema.path("deletedBy").instance, "ObjectId");
  }
});

test("Hotel validation rejects unknown and protected fields", () => {
  const payload = {
    nameAr: "فندق الاختبار",
    nameEn: "Test Hotel",
    stars: 4,
    hotelType: "hotel",
    isDeleted: true,
    deletedBy: "507f1f77bcf86cd799439011",
    arbitraryAdminField: "blocked",
  };
  const { error } = createHotelSchema("en").validate(payload, { stripUnknown: true });
  assert.ok(error);
  assert.equal(error.details[0].type, "object.unknown");
  assert.equal(error.details.some(({ path }) => path[0] === "isDeleted"), true);
});

test("RoomType validation aligns weekend and capacity fields and strips internals", () => {
  const { error, value } = createRoomTypeSchema({ isArabic: false }).validate({
    hotel: "507f1f77bcf86cd799439011",
    nameAr: "غرفة عائلية",
    nameEn: "Family Room",
    capacity: { maxAdults: 2, maxChildren: 2, maxOccupancy: 4 },
    pricing: { basePrice: 300, weekendPrice: 450, currency: "SAR" },
    isDeleted: true,
  }, { stripUnknown: true });
  assert.equal(error, undefined);
  assert.equal(value.capacity.maxOccupancy, 4);
  assert.equal(value.pricing.weekendPrice, 450);
  assert.equal(value.isDeleted, undefined);
});

test("hotel controller regression: sorting is initialized and not-found has no undefined error", async () => {
  const source = await read("../../controllers/hotels/hotel-controller.js");
  assert.equal(source.includes("sortOption[sort]"), false);
  assert.equal(source.includes("error.details.reduce"), false);
  assert.ok(source.includes('new AppError("HOTEL_NOT_FOUND"'));
});

test("Hotel and RoomType deletion is soft and never removes product files", async () => {
  const hotel = await read("../../controllers/hotels/hotel-controller.js");
  const room = await read("../../controllers/hotels/roomType-controller.js");
  assert.ok(hotel.includes("softDeleteDocument"));
  assert.ok(room.includes("softDeleteDocument"));
  assert.equal(hotel.includes("findByIdAndDelete(id)"), false);
  assert.equal(room.includes("roomType.deleteOne()"), false);
  assert.equal(room.includes("deleteImagesFromDisk(roomType.images)"), false);
});

test("preview price delegates to a domain service", async () => {
  const controller = await read("../../controllers/hotels/roomType-controller.js");
  const service = await read("../../services/hotels/room-type-preview-service.js");
  assert.ok(controller.includes("previewRoomTypeBookingPrice"));
  assert.ok(service.includes("calculateBookingPrice"));
  assert.ok(service.includes("checkAvailability"));
  assert.ok(service.includes("isDeleted: false"));
});

test("public accommodation search excludes inactive and deleted products", async () => {
  const source = await read("../../services/availability/accommodation-availability-service.js");
  assert.ok(source.includes("isActive: true"));
  assert.ok(source.includes("isDeleted: { $ne: true }"));
  assert.ok(source.includes("publicHotelSelect"));
  assert.ok(source.includes("publicRoomSelect"));
});

test("create and update controllers delegate domain work to accommodation services", async () => {
  const hotel = await read("../../controllers/hotels/hotel-controller.js");
  const room = await read("../../controllers/hotels/roomType-controller.js");
  assert.ok(hotel.includes("await createHotelService"));
  assert.ok(hotel.includes("await updateHotelService"));
  assert.ok(room.includes("await createRoomTypeService"));
  assert.ok(room.includes("await updateRoomTypeService"));
  assert.equal(hotel.includes("validateUniqueFields"), false);
  assert.equal(room.includes("validatePricingPeriods"), false);
  assert.equal(room.includes("processImages"), false);
});

test("legacy Hotel and RoomType CRUD reads are admin-only", async () => {
  const hotelRoutes = await read("../../routes/hotel/hotel-route.js");
  const roomRoutes = await read("../../routes/hotel/roomtype-route.js");
  assert.match(hotelRoutes, /get\("\/hotels", protect, authorize\("admin", "superAdmin"\)/);
  assert.match(roomRoutes, /get\("\/room-types", protect, authorize\("admin", "superAdmin"\)/);
  assert.match(roomRoutes, /get\("\/hotel\/:hotelId\/room-types", protect, authorize\("admin", "superAdmin"\)/);
});
