import assert from "node:assert/strict";
import test from "node:test";

import InventoryModel from "../../models/inventory-model.js";
import {
  createRoomTypeInventoryForPeriod,
  releaseInventory,
  reserveInventory,
} from "../../services/booking/inventory-service.js";

const dateKey = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};
const clone = (value) => structuredClone(value);

const createInventoryStore = (initialRows) => {
  const rows = new Map(initialRows.map((row, index) => [
    dateKey(row.date),
    { _id: row._id || `inventory-${index + 1}`, isActive: true, isDeleted: false, ...clone(row) },
  ]));

  const Inventory = {
    findOne: (filter) => ({
      lean: async () => clone(rows.get(dateKey(filter.date)) || null),
    }),
    findOneAndUpdate: async (filter, update) => {
      const key = dateKey(filter.date || [...rows.values()].find((row) => row._id === filter._id)?.date);
      let row = rows.get(key);

      if (update.$setOnInsert) {
        if (!row) {
          row = { _id: `inventory-${rows.size + 1}`, ...clone(update.$setOnInsert) };
          rows.set(key, row);
        }
        return clone(row);
      }

      if (!row) return null;
      if (filter.isActive !== undefined && row.isActive !== filter.isActive) return null;
      if (filter.isDeleted?.$ne === true && row.isDeleted === true) return null;
      if (filter.available?.$gte !== undefined && row.available < filter.available.$gte) return null;
      for (const field of ["total", "reserved", "blocked", "available"]) {
        if (typeof filter[field] === "number" && row[field] !== filter[field]) return null;
      }

      for (const [field, amount] of Object.entries(update.$inc || {})) row[field] += amount;
      Object.assign(row, clone(update.$set || {}));
      return clone(row);
    },
  };

  return { Inventory, row: (date) => clone(rows.get(dateKey(date))) };
};

test("concurrent reservations cannot oversell one inventory day", async () => {
  const store = createInventoryStore([
    { date: "2026-09-01", total: 5, reserved: 0, blocked: 0, available: 5 },
  ]);
  const request = {
    Inventory: store.Inventory,
    inventoryType: "roomType",
    itemId: "room-1",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    requested: 3,
  };

  const results = await Promise.allSettled([
    reserveInventory(request),
    reserveInventory(request),
  ]);

  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(results.filter(({ status }) => status === "rejected").length, 1);
  assert.equal(store.row("2026-09-01").reserved, 3);
  assert.equal(store.row("2026-09-01").available, 2);
});

test("multi-day reservation rolls back earlier dates when a later date fails", async () => {
  const store = createInventoryStore([
    { date: "2026-09-01", total: 3, reserved: 0, blocked: 0, available: 3 },
    { date: "2026-09-02", total: 3, reserved: 0, blocked: 0, available: 3 },
    { date: "2026-09-03", total: 1, reserved: 0, blocked: 0, available: 1 },
  ]);

  await assert.rejects(() => reserveInventory({
    Inventory: store.Inventory,
    inventoryType: "roomType",
    itemId: "room-1",
    startDate: "2026-09-01",
    endDate: "2026-09-04",
    requested: 2,
  }));

  assert.deepEqual(
    ["2026-09-01", "2026-09-02", "2026-09-03"].map((date) => ({
      reserved: store.row(date).reserved,
      available: store.row(date).available,
    })),
    [
      { reserved: 0, available: 3 },
      { reserved: 0, available: 3 },
      { reserved: 0, available: 1 },
    ],
  );
});

test("concurrent releases do not exceed total capacity", async () => {
  const store = createInventoryStore([
    { date: "2026-09-01", total: 5, reserved: 3, blocked: 0, available: 2 },
  ]);
  const request = {
    Inventory: store.Inventory,
    inventoryType: "roomType",
    itemId: "room-1",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    released: 3,
  };

  await Promise.allSettled([releaseInventory(request), releaseInventory(request)]);
  assert.equal(store.row("2026-09-01").reserved, 0);
  assert.equal(store.row("2026-09-01").available, 5);
});

test("release respects blocked inventory", async () => {
  const store = createInventoryStore([
    { date: "2026-09-01", total: 5, reserved: 1, blocked: 2, available: 2 },
  ]);

  await releaseInventory({
    Inventory: store.Inventory,
    inventoryType: "roomType",
    itemId: "room-1",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    released: 1,
  });

  assert.equal(store.row("2026-09-01").reserved, 0);
  assert.equal(store.row("2026-09-01").available, 3);
});

test("room inventory capacity update preserves reserved and blocked counts", async () => {
  const originalBulkWrite = InventoryModel.bulkWrite;
  const row = { total: 5, reserved: 2, blocked: 1, available: 2 };

  InventoryModel.bulkWrite = async (operations) => {
    const fields = operations[0].updateOne.update[0].$set;
    row.total = fields.total;
    row.available = Math.max(row.total - row.reserved - row.blocked, 0);
    return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
  };

  try {
    await createRoomTypeInventoryForPeriod({
      roomTypeId: "room-1",
      startDate: "2026-09-01",
      endDate: "2026-09-01",
      totalRooms: 8,
      createdBy: "user-1",
    });

    assert.deepEqual(row, { total: 8, reserved: 2, blocked: 1, available: 5 });
  } finally {
    InventoryModel.bulkWrite = originalBulkWrite;
  }
});
