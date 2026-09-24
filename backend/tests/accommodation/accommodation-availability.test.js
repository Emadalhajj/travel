import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateRoomCapacity,
  assertAccommodationSelectionAvailable,
  mapPublicAccommodationResult,
  normalizeAccommodationSearchInput,
} from "../../services/availability/accommodation-availability-service.js";
import {
  getDatesBetween,
  getInventoryAvailabilityByProduct,
} from "../../services/availability/inventory-availability-service.js";
import AvailabilityRoute from "../../routes/availability/availability-route.js";

test("stay dates are check-in inclusive and check-out exclusive", () => {
  const dates = getDatesBetween("2026-10-01", "2026-10-06");
  assert.equal(dates.length, 5);
  assert.deepEqual(
    [dates[0].getFullYear(), dates[0].getMonth() + 1, dates[0].getDate()],
    [2026, 10, 1],
  );
  assert.deepEqual(
    [dates[4].getFullYear(), dates[4].getMonth() + 1, dates[4].getDate()],
    [2026, 10, 5],
  );
  assert.throws(() => normalizeAccommodationSearchInput({ checkIn: "2026-10-01", checkOut: "2026-10-01" }));
  assert.throws(() => normalizeAccommodationSearchInput({ checkIn: "2026-10-02", checkOut: "2026-10-01" }));
});

test("capacity respects adult, child and total limits across requested rooms", () => {
  const capacity = { maxAdults: 2, maxChildren: 0 };
  assert.equal(evaluateRoomCapacity({ capacity, roomsCount: 1, adults: 2, children: 0 }).fits, true);
  assert.equal(evaluateRoomCapacity({ capacity, roomsCount: 1, adults: 3, children: 0 }).fits, false);
  assert.equal(evaluateRoomCapacity({ capacity, roomsCount: 2, adults: 4, children: 0 }).fits, true);
  assert.equal(evaluateRoomCapacity({ capacity, roomsCount: 2, adults: 5, children: 0 }).fits, false);
  assert.equal(evaluateRoomCapacity({ capacity, roomsCount: 2, adults: 3, children: 1 }).fits, false);
});

test("bulk inventory uses requested rooms and minimum availability across the stay", async () => {
  let capturedFilter;
  const Inventory = {
    find(filter) {
      capturedFilter = filter;
      return {
        select() {
          return {
            lean: async () => [5, 3, 4, 2, 4].map((available, index) => ({
              itemId: "room-1",
              date: new Date(Date.UTC(2026, 9, index + 1)),
              available,
              total: available,
              reserved: 0,
              blocked: 0,
            })),
          };
        },
      };
    },
  };
  const result = await getInventoryAvailabilityByProduct({
    products: [{ _id: "room-1" }], Inventory, inventoryType: "roomType",
    startDate: "2026-10-01", endDate: "2026-10-06", requestedQuantity: 2,
  });
  assert.equal(capturedFilter.itemId.$in.length, 1);
  assert.equal(result.get("room-1").isAvailable, true);
  assert.equal(result.get("room-1").minAvailable, 2);
});

test("one night below requested rooms makes the whole stay unavailable", async () => {
  const Inventory = { find: () => ({ select: () => ({ lean: async () =>
    [3, 1, 3, 3, 3].map((available) => ({ itemId: "room-1", available })) }) }) };
  const result = await getInventoryAvailabilityByProduct({
    products: [{ _id: "room-1" }], Inventory, inventoryType: "roomType",
    startDate: "2026-10-01", endDate: "2026-10-06", requestedQuantity: 2,
  });
  assert.equal(result.get("room-1").isAvailable, false);
  assert.equal(result.get("room-1").minAvailable, 1);
});

test("public projection excludes private hotel and pricing fields", () => {
  const result = mapPublicAccommodationResult({
    roomType: {
      _id: "room-1", nameAr: "غرفة", nameEn: "Room", capacity: { maxAdults: 2 },
      pricing: { basePrice: 100, currency: "SAR", internal: "secret" },
      hotel: {
        _id: "hotel-1", nameAr: "فندق", nameEn: "Hotel", stars: 5,
        contact: { email: "private@example.com" }, attachments: [{ url: "contract.pdf" }],
      },
    },
    availability: { isAvailable: true, minAvailable: 2 },
    input: { checkIn: "2026-10-01", checkOut: "2026-10-06", nights: 5, roomsCount: 1 },
  });
  assert.equal(result.hotel.contact, undefined);
  assert.equal(result.hotel.attachments, undefined);
  assert.deepEqual(Object.keys(result.pricing).sort(), ["basePrice", "currency", "semantics"]);
});

test("public search route is registered before protected package availability", () => {
  const layers = AvailabilityRoute.stack;
  const publicIndex = layers.findIndex((layer) => layer.route?.path === "/public/accommodations/search");
  const protectedIndex = layers.findIndex((layer) => layer.route?.path === "/availability/products");
  assert.ok(publicIndex >= 0 && publicIndex < protectedIndex);
  assert.equal(layers[publicIndex].route.stack.length, 1);
  assert.ok(layers[protectedIndex].route.stack.length > 1);
});

const roomTypeModel = (roomType) => ({
  findOne: () => ({
    populate: () => ({
      select: () => ({ lean: async () => roomType }),
    }),
  }),
});

const inventoryModel = (availableValues) => ({
  find: () => ({
    select: () => ({
      lean: async () => availableValues.map((available) => ({ itemId: "room-1", available })),
    }),
  }),
});

const selection = {
  roomTypeId: "room-1", checkIn: "2026-10-01", checkOut: "2026-10-06",
  roomsCount: 2, adults: 4, children: 0,
};

test("draft guard rejects capacity changed after search", async () => {
  await assert.rejects(() => assertAccommodationSelectionAvailable({
    ...selection,
    dependencies: {
      RoomTypeModel: roomTypeModel({
        _id: "room-1", hotel: { _id: "hotel-1" }, capacity: { maxAdults: 1, maxChildren: 0 },
        availability: { availablePeriods: [{ startDate: "2026-01-01", endDate: "2026-12-31", isActive: true }] },
      }),
      InventoryModel: inventoryModel([5, 5, 5, 5, 5]),
    },
  }), ({ message }) => message === "ACCOMMODATION_CAPACITY_EXCEEDED");
});

test("draft guard rejects inventory changed after search and accepts a valid selection", async () => {
  const RoomTypeModel = roomTypeModel({
    _id: "room-1", hotel: { _id: "hotel-1" }, capacity: { maxAdults: 2, maxChildren: 0 },
    availability: { availablePeriods: [{ startDate: "2026-01-01", endDate: "2026-12-31", isActive: true }] },
  });
  await assert.rejects(() => assertAccommodationSelectionAvailable({
    ...selection,
    dependencies: { RoomTypeModel, InventoryModel: inventoryModel([3, 1, 3, 3, 3]) },
  }), ({ message }) => message === "ACCOMMODATION_NOT_AVAILABLE");
  const available = await assertAccommodationSelectionAvailable({
    ...selection,
    dependencies: { RoomTypeModel, InventoryModel: inventoryModel([3, 2, 4, 3, 3]) },
  });
  assert.equal(available.isAvailable, true);
  assert.equal(available.minAvailable, 2);
});

test("draft guard accepts legacy rooms without a sales-window policy when every night has inventory", async () => {
  for (const roomType of [
    { _id: "room-1", hotel: { _id: "hotel-1" }, capacity: { maxAdults: 2, maxChildren: 0 } },
    {
      _id: "room-1",
      hotel: { _id: "hotel-1" },
      capacity: { maxAdults: 2, maxChildren: 0 },
      availability: { availablePeriods: [] },
    },
  ]) {
    const result = await assertAccommodationSelectionAvailable({
      ...selection,
      dependencies: {
        RoomTypeModel: roomTypeModel(roomType),
        InventoryModel: inventoryModel([3, 2, 4, 3, 3]),
      },
    });
    assert.equal(result.isAvailable, true);
  }
});

test("draft guard respects an explicitly configured non-matching sales window", async () => {
  await assert.rejects(() => assertAccommodationSelectionAvailable({
    ...selection,
    dependencies: {
      RoomTypeModel: roomTypeModel({
        _id: "room-1",
        hotel: { _id: "hotel-1" },
        capacity: { maxAdults: 2, maxChildren: 0 },
        availability: {
          availablePeriods: [{
            startDate: "2026-10-03",
            endDate: "2026-12-31",
            isActive: true,
          }],
        },
      }),
      InventoryModel: inventoryModel([5, 5, 5, 5, 5]),
    },
  }), ({ message }) => message === "ACCOMMODATION_NOT_AVAILABLE");
});

test("inventory remains mandatory when no sales-window policy is configured", async () => {
  const RoomTypeModel = roomTypeModel({
    _id: "room-1",
    hotel: { _id: "hotel-1" },
    capacity: { maxAdults: 2, maxChildren: 0 },
  });

  await assert.rejects(() => assertAccommodationSelectionAvailable({
    ...selection,
    dependencies: { RoomTypeModel, InventoryModel: inventoryModel([5, 5, 5, 5]) },
  }), ({ message }) => message === "ACCOMMODATION_NOT_AVAILABLE");

  await assert.rejects(() => assertAccommodationSelectionAvailable({
    ...selection,
    roomsCount: 4,
    adults: 4,
    dependencies: { RoomTypeModel, InventoryModel: inventoryModel([3, 3, 3, 3, 3]) },
  }), ({ message }) => message === "ACCOMMODATION_NOT_AVAILABLE");
});
