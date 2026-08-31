import assert from "node:assert/strict";
import test from "node:test";

import InventoryModel from "../../models/inventory-model.js";
import {
  calculateAvailableCount,
  checkInventoryForWholePeriod,
  filterProductsByAvailabilityPolicy,
  getInventoryAvailabilityByProduct,
} from "../../services/availability/inventory-availability-service.js";
import { checkRoomAvailability } from "../../services/booking/availability.js";

const queryWith = (records) => ({
  select() { return this; },
  lean: async () => records,
});

test("inventory availability uses atomic available and computed fallback", async () => {
  const Inventory = {
    find: () => queryWith([
      { total: 5, reserved: 1, blocked: 1, available: 3 },
      { total: 5, reserved: 2, blocked: 1 },
    ]),
  };
  const result = await checkInventoryForWholePeriod({
    Inventory,
    inventoryType: "roomType",
    itemId: "room-1",
    startDate: "2026-09-01",
    endDate: "2026-09-03",
    requestedQuantity: 3,
  });

  assert.equal(calculateAvailableCount({ total: 5, reserved: 2, blocked: 1 }), 2);
  assert.equal(result.minAvailable, 2);
  assert.equal(result.isAvailable, false);
});

test("availability policy bypasses inventory only when product explicitly allows it", async () => {
  let inventoryChecks = 0;
  const Inventory = {
    find: () => {
      inventoryChecks += 1;
      return queryWith([]);
    },
  };
  const products = [
    { _id: "always", isAlwaysAvailable: true },
    { _id: "limited", isAlwaysAvailable: false },
  ];
  const result = await filterProductsByAvailabilityPolicy({
    products,
    Inventory,
    inventoryType: "visa",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    mapProduct: ({ doc, extra }) => ({ id: doc._id, ...extra }),
  });

  assert.deepEqual(result.map(({ id }) => id), ["always"]);
  assert.equal(inventoryChecks, 1);
});

test("availability batches all products of one resource type into one inventory query", async () => {
  let inventoryQueries = 0;
  let receivedFilter;
  const Inventory = {
    find: (filter) => {
      inventoryQueries += 1;
      receivedFilter = filter;
      return queryWith([
        { itemId: "one", date: "2026-09-01", available: 4 },
        { itemId: "one", date: "2026-09-02", available: 2 },
        { itemId: "two", date: "2026-09-01", available: 5 },
      ]);
    },
  };
  const availability = await getInventoryAvailabilityByProduct({
    products: [{ _id: "one" }, { _id: "two" }],
    Inventory,
    inventoryType: "trip",
    startDate: "2026-09-01",
    endDate: "2026-09-03",
    requestedQuantity: 2,
  });

  assert.equal(inventoryQueries, 1);
  assert.deepEqual(receivedFilter.itemId, { $in: ["one", "two"] });
  assert.deepEqual(availability.get("one"), {
    isAvailable: true,
    minAvailable: 2,
    reason: "AVAILABLE",
  });
  assert.equal(availability.get("two").reason, "MISSING_INVENTORY");
});

test("legacy room availability reads the shared Inventory model", async () => {
  const originalFind = InventoryModel.find;
  let inventoryRead = false;
  InventoryModel.find = () => {
    inventoryRead = true;
    return queryWith([{ total: 4, reserved: 1, blocked: 0, available: 3 }]);
  };

  try {
    const result = await checkRoomAvailability({
      roomTypeId: "room-1",
      checkIn: "2026-09-01",
      checkOut: "2026-09-02",
      requestedRooms: 2,
      RoomType: { findById: async () => ({ _id: "room-1", totalRooms: 99 }) },
      Booking: { find: () => { throw new Error("Legacy booking overlap must not run"); } },
    });

    assert.equal(inventoryRead, true);
    assert.equal(result.canBook, true);
    assert.equal(result.available, 3);
    assert.equal(result.availabilityReason, "AVAILABLE");
  } finally {
    InventoryModel.find = originalFind;
  }
});
