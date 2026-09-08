import assert from "node:assert/strict";
import test from "node:test";

import { INVENTORY_HOLD_STATUSES } from "../../constants/inventory/inventory-hold-statuses.js";
import { INVENTORY_RESERVATION_MODES } from "../../constants/inventory/inventory-reservation-modes.js";
import { INVENTORY_TYPES } from "../../constants/inventory/inventory-types.js";
import InventoryHoldModel from "../../models/inventory-hold-model.js";
import { createInventoryHoldServiceLayer } from "../../services/booking/inventory-hold-service.js";

const clone = (value) => structuredClone(value);

const createHoldStore = () => {
  const rows = new Map();
  let sequence = 0;
  const matches = (row, filter) => {
    if (filter._id && String(filter._id) !== String(row._id)) return false;
    if (filter.idempotencyKey && filter.idempotencyKey !== row.idempotencyKey) return false;
    if (filter.isActive !== undefined && filter.isActive !== row.isActive) return false;
    if (filter.draftBooking && String(filter.draftBooking) !== String(row.draftBooking)) return false;
    if (filter.paymentTransaction && String(filter.paymentTransaction) !== String(row.paymentTransaction)) return false;
    if (filter.status?.$in && !filter.status.$in.includes(row.status)) return false;
    if (typeof filter.status === "string" && filter.status !== row.status) return false;
    if (filter.expiresAt?.$lte && new Date(row.expiresAt) > filter.expiresAt.$lte) return false;
    if (filter.expiresAt?.$gt && new Date(row.expiresAt) <= filter.expiresAt.$gt) return false;
    return true;
  };
  const applySet = (row, set = {}) => {
    for (const [path, value] of Object.entries(set)) {
      if (path === "inventoryReservations.$.releasedAt") continue;
      if (path === "programReservation.releasedAt") row.programReservation.releasedAt = value;
      else row[path] = value;
    }
  };
  const document = (row) => (row ? { ...clone(row), toObject: () => clone(row) } : null);

  const HoldModel = {
    create: async ([input]) => {
      if ([...rows.values()].some((row) =>
        row.idempotencyKey === input.idempotencyKey && row.isActive === true
      )) {
        const error = new Error("duplicate key");
        error.code = 11000;
        throw error;
      }
      const row = clone({ ...input, _id: `hold-${++sequence}` });
      row.inventoryReservations = row.inventoryReservations.map((resource, index) => ({
        ...resource,
        _id: `${row._id}-resource-${index + 1}`,
        releasedAt: null,
      }));
      if (row.programReservation) row.programReservation.releasedAt = null;
      rows.set(row._id, row);
      return [document(row)];
    },
    findOne: async (filter) =>
      document([...rows.values()].find((row) => matches(row, filter))),
    findById: async (id) => document(rows.get(String(id))),
    findOneAndUpdate: async (filter, update) => {
      const row = [...rows.values()].find((candidate) => matches(candidate, filter));
      if (!row) return null;
      applySet(row, update.$set);
      return document(row);
    },
    updateOne: async (filter, update) => {
      const row = [...rows.values()].find((candidate) => matches(candidate, filter));
      if (!row) return { modifiedCount: 0 };
      const resourceId = filter["inventoryReservations._id"];
      if (resourceId) {
        const resource = row.inventoryReservations.find(({ _id }) => _id === resourceId);
        if (resource) resource.releasedAt = update.$set["inventoryReservations.$.releasedAt"];
      } else {
        applySet(row, update.$set);
      }
      return { modifiedCount: 1 };
    },
    find: (filter) => ({
      select: () => ({
        limit: async (limit) => [...rows.values()]
          .filter((row) => matches(row, filter))
          .slice(0, limit)
          .map((row) => ({ _id: row._id })),
      }),
    }),
  };

  return { HoldModel, get: (id) => clone(rows.get(String(id))) };
};

const setup = ({
  dailyCapacity = 10,
  programCapacity = 10,
  failDailyAt = 0,
  failSingleAt = 0,
  reserveDelayMs = 0,
} = {}) => {
  const store = createHoldStore();
  let currentNow = new Date("2026-09-01T12:00:00.000Z");
  let dailyReserved = 0;
  let programReserved = 0;
  let dailyCalls = 0;
  let singleReserved = 0;
  let singleCalls = 0;
  const operations = [];
  const services = createInventoryHoldServiceLayer({
    HoldModel: store.HoldModel,
    InventoryModel: {},
    reserveDailyInventory: async ({ requested }) => {
      dailyCalls += 1;
      operations.push("reserve:PERIOD");
      if (reserveDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, reserveDelayMs));
      }
      if (dailyCalls === failDailyAt || dailyReserved + requested > dailyCapacity) {
        throw new Error("insufficient daily inventory");
      }
      dailyReserved += requested;
    },
    releaseDailyInventory: async ({ released }) => {
      operations.push("release:PERIOD");
      dailyReserved = Math.max(dailyReserved - released, 0);
    },
    reserveSingleInventoryRecord: async ({ requested }) => {
      singleCalls += 1;
      operations.push("reserve:SINGLE");
      if (
        singleCalls === failSingleAt ||
        singleReserved + requested > dailyCapacity
      ) {
        throw new Error("insufficient single inventory");
      }
      singleReserved += requested;
    },
    releaseSingleInventoryRecord: async ({ released }) => {
      operations.push("release:SINGLE");
      singleReserved = Math.max(singleReserved - released, 0);
    },
    reserveSeats: async ({ seats }) => {
      if (programReserved + seats > programCapacity) throw new Error("insufficient seats");
      programReserved += seats;
    },
    releaseSeats: async ({ seats }) => {
      programReserved = Math.max(programReserved - seats, 0);
    },
    now: () => new Date(currentNow),
  });
  return {
    ...services,
    store,
    counts: () => ({ dailyReserved, programReserved }),
    inventoryCounts: () => ({ dailyReserved, singleReserved }),
    operations: () => [...operations],
    setNow: (value) => {
      currentNow = new Date(value);
    },
  };
};

const inventoryResource = (quantity = 2, itemId = "000000000000000000000001") => ({
  inventoryType: "roomType",
  itemId,
  startDate: "2026-09-02",
  endDate: "2026-09-03",
  quantity,
  defaultTotal: 10,
});

const singleInventoryResource = (
  quantity = 2,
  itemId = "000000000000000000000009",
) => ({
  inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
  reservationMode: INVENTORY_RESERVATION_MODES.SINGLE,
  itemId,
  date: "2026-09-02T08:00:00.000Z",
  quantity,
  defaultTotal: 10,
});

test("InventoryHold validates fields required by each reservation mode", async () => {
  const base = {
    idempotencyKey: "mode-validation",
    expiresAt: "2026-09-10T00:00:00.000Z",
  };

  await assert.rejects(
    () => new InventoryHoldModel({
      ...base,
      inventoryReservations: [{
        ...singleInventoryResource(),
        date: null,
      }],
    }).validate(),
    /date is required for SINGLE/,
  );

  await assert.rejects(
    () => new InventoryHoldModel({
      ...base,
      inventoryReservations: [{
        ...inventoryResource(),
        endDate: null,
      }],
    }).validate(),
    /startDate and endDate are required for PERIOD/,
  );

  const legacy = new InventoryHoldModel({
    ...base,
    inventoryReservations: [inventoryResource()],
  });
  await legacy.validate();
  assert.equal(
    legacy.inventoryReservations[0].reservationMode,
    INVENTORY_RESERVATION_MODES.PERIOD,
  );
});

test("mixed hold dispatches PERIOD and SINGLE resources to their operations", async () => {
  const fixture = setup();
  const hold = await fixture.createInventoryHoldService({
    idempotencyKey: "mixed-modes",
    inventoryReservations: [inventoryResource(2), singleInventoryResource(3)],
  });

  assert.equal(hold.status, INVENTORY_HOLD_STATUSES.HELD);
  assert.deepEqual(fixture.inventoryCounts(), {
    dailyReserved: 2,
    singleReserved: 3,
  });
  assert.deepEqual(fixture.operations(), ["reserve:PERIOD", "reserve:SINGLE"]);

  await fixture.releaseInventoryHoldService({ holdId: hold._id });
  assert.deepEqual(fixture.inventoryCounts(), {
    dailyReserved: 0,
    singleReserved: 0,
  });
  assert.deepEqual(fixture.operations().slice(-2), ["release:SINGLE", "release:PERIOD"]);
});

test("failure after PERIOD and SINGLE reservations rolls both back in reverse order", async () => {
  const fixture = setup({ failDailyAt: 2 });

  await assert.rejects(() => fixture.createInventoryHoldService({
    idempotencyKey: "mixed-rollback",
    inventoryReservations: [
      inventoryResource(2),
      singleInventoryResource(3),
      inventoryResource(1, "000000000000000000000002"),
    ],
  }));

  assert.deepEqual(fixture.inventoryCounts(), {
    dailyReserved: 0,
    singleReserved: 0,
  });
  assert.deepEqual(fixture.operations(), [
    "reserve:PERIOD",
    "reserve:SINGLE",
    "reserve:PERIOD",
    "release:SINGLE",
    "release:PERIOD",
  ]);
});

test("a failed SINGLE reservation releases an earlier PERIOD reservation", async () => {
  const fixture = setup({ failSingleAt: 1 });

  await assert.rejects(() => fixture.createInventoryHoldService({
    idempotencyKey: "single-failure",
    inventoryReservations: [inventoryResource(2), singleInventoryResource(3)],
  }));

  assert.deepEqual(fixture.inventoryCounts(), {
    dailyReserved: 0,
    singleReserved: 0,
  });
  assert.deepEqual(fixture.operations(), [
    "reserve:PERIOD",
    "reserve:SINGLE",
    "release:PERIOD",
  ]);
});

test("creates a hold by reserving program seats and daily inventory", async () => {
  const fixture = setup();
  const hold = await fixture.createInventoryHoldService({
    idempotencyKey: "create-1",
    programReservation: { program: "000000000000000000000010", seats: 2 },
    inventoryReservations: [inventoryResource(2)],
  });

  assert.equal(hold.status, INVENTORY_HOLD_STATUSES.HELD);
  assert.deepEqual(fixture.counts(), { dailyReserved: 2, programReserved: 2 });
});

test("concurrent holds cannot exceed the atomic inventory capacity", async () => {
  const fixture = setup({ dailyCapacity: 5 });
  const results = await Promise.allSettled([
    fixture.createInventoryHoldService({ idempotencyKey: "race-1", inventoryReservations: [inventoryResource(3)] }),
    fixture.createInventoryHoldService({ idempotencyKey: "race-2", inventoryReservations: [inventoryResource(3)] }),
  ]);

  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(results.filter(({ status }) => status === "rejected").length, 1);
  assert.equal(fixture.counts().dailyReserved, 3);
});

test("concurrent TripDeparture holds cannot oversell SINGLE inventory", async () => {
  const fixture = setup({ dailyCapacity: 5, reserveDelayMs: 5 });
  const results = await Promise.allSettled([
    fixture.createInventoryHoldService({
      idempotencyKey: "trip-race-1",
      inventoryReservations: [singleInventoryResource(3)],
    }),
    fixture.createInventoryHoldService({
      idempotencyKey: "trip-race-2",
      inventoryReservations: [singleInventoryResource(3)],
    }),
  ]);

  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(results.filter(({ status }) => status === "rejected").length, 1);
  assert.equal(fixture.inventoryCounts().singleReserved, 3);
});

test("a partial create failure rolls back all resources already reserved", async () => {
  const fixture = setup({ failDailyAt: 2 });
  await assert.rejects(() => fixture.createInventoryHoldService({
    idempotencyKey: "rollback-1",
    programReservation: { program: "000000000000000000000010", seats: 2 },
    inventoryReservations: [inventoryResource(2), inventoryResource(2, "000000000000000000000002")],
  }));

  assert.deepEqual(fixture.counts(), { dailyReserved: 0, programReserved: 0 });
});

test("release is idempotent and returns capacity only once", async () => {
  const fixture = setup();
  const hold = await fixture.createInventoryHoldService({
    idempotencyKey: "release-1",
    programReservation: { program: "000000000000000000000010", seats: 2 },
    inventoryReservations: [inventoryResource(2)],
  });

  const first = await fixture.releaseInventoryHoldService({ holdId: hold._id, reason: "test" });
  const second = await fixture.releaseInventoryHoldService({ holdId: hold._id, reason: "test" });
  assert.equal(first.status, INVENTORY_HOLD_STATUSES.RELEASED);
  assert.equal(second.status, INVENTORY_HOLD_STATUSES.RELEASED);
  assert.deepEqual(fixture.counts(), { dailyReserved: 0, programReserved: 0 });
});

test("commit is idempotent and keeps the reserved capacity", async () => {
  const fixture = setup();
  const hold = await fixture.createInventoryHoldService({
    idempotencyKey: "commit-1",
    inventoryReservations: [inventoryResource(2)],
  });
  const first = await fixture.commitInventoryHoldService({ holdId: hold._id });
  const second = await fixture.commitInventoryHoldService({ holdId: hold._id });

  assert.equal(first.status, INVENTORY_HOLD_STATUSES.COMMITTED);
  assert.equal(second.status, INVENTORY_HOLD_STATUSES.COMMITTED);
  assert.equal(fixture.counts().dailyReserved, 2);
});

test("expiration releases active holds and marks them expired", async () => {
  const fixture = setup();
  const hold = await fixture.createInventoryHoldService({
    idempotencyKey: "expiry-1",
    expiresAt: "2026-09-01T12:01:00.000Z",
    inventoryReservations: [inventoryResource(2)],
  });
  fixture.setNow("2026-09-01T12:02:00.000Z");
  const result = await fixture.expireInventoryHoldsService();

  assert.equal(result.processed, 1);
  assert.equal(result.expired, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.holds[0].holdId, hold._id);
  assert.equal(result.holds[0].status, "expired");
  assert.equal(fixture.store.get(hold._id).status, INVENTORY_HOLD_STATUSES.EXPIRED);
  assert.equal(fixture.counts().dailyReserved, 0);
});

test("concurrent creation with the same key reserves inventory once", async () => {
  const fixture = setup({ reserveDelayMs: 50 });
  const input = {
    idempotencyKey: "same-checkout",
    paymentTransaction: "payment-1",
    inventoryReservations: [inventoryResource(2)],
  };
  const [first, second] = await Promise.all([
    fixture.createInventoryHoldService(input),
    fixture.createInventoryHoldService(input),
  ]);

  assert.equal(first._id, second._id);
  assert.equal(fixture.counts().dailyReserved, 2);
});

test("a released hold key can create a new active hold without deleting history", async () => {
  const fixture = setup();
  const input = {
    idempotencyKey: "renewable-checkout",
    inventoryReservations: [inventoryResource(2)],
  };
  const oldHold = await fixture.createInventoryHoldService(input);
  await fixture.releaseInventoryHoldService({ holdId: oldHold._id });
  const newHold = await fixture.createInventoryHoldService(input);

  assert.notEqual(newHold._id, oldHold._id);
  assert.equal(newHold.status, INVENTORY_HOLD_STATUSES.HELD);
  assert.equal(fixture.counts().dailyReserved, 2);
});

test("hold commit lookup validates draft and payment ownership", async () => {
  const fixture = setup();
  const hold = await fixture.createInventoryHoldService({
    idempotencyKey: "owned-hold",
    draftBooking: "draft-1",
    paymentTransaction: "payment-1",
    inventoryReservations: [inventoryResource(1)],
  });

  const matched = await fixture.getInventoryHoldForCommitService({
    holdId: hold._id,
    draftBooking: "draft-1",
    paymentTransaction: "payment-1",
  });
  assert.equal(matched._id, hold._id);
  await assert.rejects(() => fixture.getInventoryHoldForCommitService({
    holdId: hold._id,
    draftBooking: "draft-1",
    paymentTransaction: "payment-2",
  }));
});
