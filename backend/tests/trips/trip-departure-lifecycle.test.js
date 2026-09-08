import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import AuditLog from "../../models/audit/audit-log-model.js";
import Inventory from "../../models/inventory-model.js";
import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import {
  canTransitionTripDepartureStatus,
  TRIP_DEPARTURE_STATUS,
} from "../../constants/trips/trip-departure.constants.js";
import {
  cancelTripDepartureService,
  completeTripDepartureService,
  createTripDepartureService,
  scheduleTripDepartureService,
  toggleTripDepartureActiveService,
  updateTripDepartureService,
} from "../../services/trips/trip-departure-service.js";
import { normalizeInventoryDate } from "../../services/booking/inventory-service.js";

const futureDate = "2036-10-10T08:00:00.000Z";
const laterDate = "2036-10-11T08:00:00.000Z";

const makeDeparture = (overrides = {}) => ({
  _id: "64b000000000000000000002",
  tripId: "64b000000000000000000001",
  status: TRIP_DEPARTURE_STATUS.DRAFT,
  isActive: true,
  isDeleted: false,
  departureAt: futureDate,
  arrivalAt: "2036-10-10T12:00:00.000Z",
  pricing: { basePrice: 100, currency: "SAR" },
  capacity: { totalSeats: 10 },
  segments: [],
  updatedBy: null,
  async save() { return this; },
  toObject() {
    return Object.fromEntries(
      Object.entries(this).filter(([, value]) => typeof value !== "function"),
    );
  },
  ...overrides,
});

const queryResult = (value) => ({
  session() { return this; },
  lean: async () => value,
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
});

const sameDate = (left, right) =>
  new Date(left).getTime() === new Date(right).getTime();

const installFixture = ({ departure: supplied, tripActive = true, inventory: suppliedInventory = null } = {}) => {
  const departure = supplied || makeDeparture();
  let inventory = suppliedInventory
    ? { ...suppliedInventory, date: normalizeInventoryDate(suppliedInventory.date) }
    : null;
  const audits = [];
  const originals = {
    startSession: mongoose.startSession,
    tripFindOne: Trip.findOne,
    departureFindOne: TripDeparture.findOne,
    inventoryFindOne: Inventory.findOne,
    inventoryFindOneAndUpdate: Inventory.findOneAndUpdate,
    auditCreate: AuditLog.create,
  };

  mongoose.startSession = async () => ({
    async withTransaction(work) { return work(); },
    async endSession() {},
  });
  Trip.findOne = async () => ({ _id: departure.tripId, isActive: tripActive });
  TripDeparture.findOne = async () => departure;
  AuditLog.create = async (entry) => { audits.push(entry); return entry; };
  Inventory.findOne = (filter) => queryResult(
    inventory && sameDate(inventory.date, filter.date) ? { ...inventory } : null,
  );
  Inventory.findOneAndUpdate = async (filter, update) => {
    if (update.$setOnInsert) {
      if (!inventory) inventory = { _id: "inventory-1", ...update.$setOnInsert };
      return { ...inventory };
    }

    const consumed = Number(inventory?.reserved || 0) + Number(inventory?.blocked || 0);
    if (Array.isArray(update)) {
      const nextTotal = Number(update[0].$set.total);
      if (!inventory || consumed > nextTotal) return null;
      inventory = {
        ...inventory,
        total: nextTotal,
        available: Math.max(nextTotal - consumed, 0),
        isActive: update[0].$set.isActive,
      };
      return { ...inventory };
    }

    if (!inventory || !sameDate(inventory.date, filter.date)) return null;
    if (update.$set.date) {
      if (consumed > 0) return null;
      inventory.date = update.$set.date;
    }
    if (Object.hasOwn(update.$set, "isActive")) {
      inventory.isActive = update.$set.isActive;
    }
    return { ...inventory };
  };

  return {
    departure,
    audits,
    get inventory() { return inventory; },
    restore() {
      mongoose.startSession = originals.startSession;
      Trip.findOne = originals.tripFindOne;
      TripDeparture.findOne = originals.departureFindOne;
      Inventory.findOne = originals.inventoryFindOne;
      Inventory.findOneAndUpdate = originals.inventoryFindOneAndUpdate;
      AuditLog.create = originals.auditCreate;
    },
  };
};

const invoke = (service) => service({
  departureId: "64b000000000000000000002",
  userId: "64b000000000000000000003",
  req: { user: { _id: "64b000000000000000000003" }, headers: {} },
});

const rejectsCode = (promise, code) =>
  assert.rejects(promise, (error) => error.code === code);

test("DRAFT may transition to SCHEDULED", () => {
  assert.equal(canTransitionTripDepartureStatus("DRAFT", "SCHEDULED"), true);
});

test("creation cannot bypass the lifecycle by starting as SCHEDULED", async () => {
  await rejectsCode(
    createTripDepartureService({ data: { status: "SCHEDULED" } }),
    "TRIP_DEPARTURE_STATUS_UPDATE_FORBIDDEN",
  );
});

test("DRAFT may transition to CANCELLED", () => {
  assert.equal(canTransitionTripDepartureStatus("DRAFT", "CANCELLED"), true);
});

test("SCHEDULED may transition to COMPLETED or CANCELLED", () => {
  assert.equal(canTransitionTripDepartureStatus("SCHEDULED", "COMPLETED"), true);
  assert.equal(canTransitionTripDepartureStatus("SCHEDULED", "CANCELLED"), true);
});

test("terminal states cannot transition", () => {
  assert.equal(canTransitionTripDepartureStatus("CANCELLED", "SCHEDULED"), false);
  assert.equal(canTransitionTripDepartureStatus("COMPLETED", "SCHEDULED"), false);
});

test("scheduling creates and activates matching inventory", async () => {
  const fixture = installFixture();
  try {
    await invoke(scheduleTripDepartureService);
    assert.equal(fixture.departure.status, "SCHEDULED");
    assert.equal(fixture.inventory.total, 10);
    assert.equal(fixture.inventory.available, 10);
    assert.equal(fixture.inventory.isActive, true);
  } finally { fixture.restore(); }
});

test("scheduling the same scheduled departure is idempotent", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 0, blocked: 0, available: 10, isActive: true },
  });
  try {
    await invoke(scheduleTripDepartureService);
    assert.equal(fixture.audits.length, 0);
  } finally { fixture.restore(); }
});

test("past departure cannot be scheduled", async () => {
  const fixture = installFixture({ departure: makeDeparture({ departureAt: "2020-01-01T00:00:00.000Z" }) });
  try { await rejectsCode(invoke(scheduleTripDepartureService), "TRIP_DEPARTURE_PAST"); }
  finally { fixture.restore(); }
});

test("zero-capacity departure cannot be scheduled", async () => {
  const fixture = installFixture({ departure: makeDeparture({ capacity: { totalSeats: 0 } }) });
  try { await rejectsCode(invoke(scheduleTripDepartureService), "TRIP_DEPARTURE_CAPACITY_REQUIRED"); }
  finally { fixture.restore(); }
});

test("departure of an inactive trip cannot be scheduled", async () => {
  const fixture = installFixture({ tripActive: false });
  try { await rejectsCode(invoke(scheduleTripDepartureService), "TRIP_NOT_FOUND"); }
  finally { fixture.restore(); }
});

test("cancelled departure cannot be scheduled", async () => {
  const fixture = installFixture({ departure: makeDeparture({ status: "CANCELLED", isActive: false }) });
  try { await rejectsCode(invoke(scheduleTripDepartureService), "TRIP_DEPARTURE_TRANSITION_INVALID"); }
  finally { fixture.restore(); }
});

test("draft cancellation does not create inventory", async () => {
  const fixture = installFixture();
  try {
    await invoke(cancelTripDepartureService);
    assert.equal(fixture.departure.status, "CANCELLED");
    assert.equal(fixture.inventory, null);
  } finally { fixture.restore(); }
});

test("unused scheduled departure can be cancelled and inventory disabled", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 0, blocked: 0, available: 10, isActive: true },
  });
  try {
    await invoke(cancelTripDepartureService);
    assert.equal(fixture.inventory.isActive, false);
    assert.equal(fixture.departure.status, "CANCELLED");
  } finally { fixture.restore(); }
});

test("consumed scheduled departure cannot be cancelled", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 1, blocked: 0, available: 9, isActive: true },
  });
  try { await rejectsCode(invoke(cancelTripDepartureService), "TRIP_DEPARTURE_CONSUMED"); }
  finally { fixture.restore(); }
});

test("completion disables inventory without releasing consumption", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 3, blocked: 2, available: 5, isActive: true },
  });
  try {
    await invoke(completeTripDepartureService);
    assert.equal(fixture.inventory.isActive, false);
    assert.equal(fixture.inventory.reserved, 3);
    assert.equal(fixture.inventory.blocked, 2);
  } finally { fixture.restore(); }
});

test("draft departure cannot be completed", async () => {
  const fixture = installFixture();
  try { await rejectsCode(invoke(completeTripDepartureService), "TRIP_DEPARTURE_TRANSITION_INVALID"); }
  finally { fixture.restore(); }
});

test("generic update cannot change lifecycle status", async () => {
  const fixture = installFixture();
  try {
    await rejectsCode(updateTripDepartureService({ departureId: fixture.departure._id, data: { status: "SCHEDULED" } }), "TRIP_DEPARTURE_STATUS_UPDATE_FORBIDDEN");
  } finally { fixture.restore(); }
});

test("draft date update does not create inventory", async () => {
  const fixture = installFixture();
  try {
    await updateTripDepartureService({
      departureId: fixture.departure._id,
      data: { departureAt: laterDate, arrivalAt: "2036-10-11T12:00:00.000Z" },
      userId: "user",
    });
    assert.equal(fixture.inventory, null);
  } finally { fixture.restore(); }
});

test("scheduled capacity update preserves reserved and blocked", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 3, blocked: 2, available: 5, isActive: true },
  });
  try {
    await updateTripDepartureService({ departureId: fixture.departure._id, data: { capacity: { totalSeats: 12 } }, userId: "user" });
    assert.deepEqual(
      { total: fixture.inventory.total, reserved: fixture.inventory.reserved, blocked: fixture.inventory.blocked, available: fixture.inventory.available },
      { total: 12, reserved: 3, blocked: 2, available: 7 },
    );
  } finally { fixture.restore(); }
});

test("capacity reduction equal to or above consumed remains allowed", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 3, blocked: 2, available: 5, isActive: true },
  });
  try {
    await updateTripDepartureService({ departureId: fixture.departure._id, data: { capacity: { totalSeats: 5 } }, userId: "user" });
    assert.equal(fixture.inventory.total, 5);
    assert.equal(fixture.inventory.available, 0);
  } finally { fixture.restore(); }
});

test("scheduled capacity cannot be reduced below consumption", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 3, blocked: 2, available: 5, isActive: true },
  });
  try {
    await rejectsCode(
      updateTripDepartureService({ departureId: fixture.departure._id, data: { capacity: { totalSeats: 4 } }, userId: "user" }),
      "INVENTORY_CAPACITY_BELOW_CONSUMED",
    );
  } finally { fixture.restore(); }
});

test("unused scheduled inventory moves with departure date", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 0, blocked: 0, available: 10, isActive: true },
  });
  try {
    await updateTripDepartureService({
      departureId: fixture.departure._id,
      data: { departureAt: laterDate, arrivalAt: "2036-10-11T12:00:00.000Z" },
      userId: "user",
    });
    assert.equal(
      sameDate(fixture.inventory.date, normalizeInventoryDate(laterDate)),
      true,
    );
  } finally { fixture.restore(); }
});

test("consumed scheduled inventory cannot move to another date", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED" }),
    inventory: { date: futureDate, total: 10, reserved: 1, blocked: 0, available: 9, isActive: true },
  });
  try {
    await rejectsCode(
      updateTripDepartureService({
        departureId: fixture.departure._id,
        data: { departureAt: laterDate, arrivalAt: "2036-10-11T12:00:00.000Z" },
        userId: "user",
      }),
      "INVENTORY_RESCHEDULE_CONSUMED",
    );
  } finally { fixture.restore(); }
});

test("scheduled active toggle synchronizes inventory", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED", isActive: true }),
    inventory: { date: futureDate, total: 10, reserved: 0, blocked: 0, available: 10, isActive: true },
  });
  try {
    await invoke(toggleTripDepartureActiveService);
    assert.equal(fixture.departure.isActive, false);
    assert.equal(fixture.inventory.isActive, false);
  } finally { fixture.restore(); }
});

test("scheduled departure can be reactivated with its inventory", async () => {
  const fixture = installFixture({
    departure: makeDeparture({ status: "SCHEDULED", isActive: false }),
    inventory: { date: futureDate, total: 10, reserved: 0, blocked: 0, available: 10, isActive: false },
  });
  try {
    await invoke(toggleTripDepartureActiveService);
    assert.equal(fixture.departure.isActive, true);
    assert.equal(fixture.inventory.isActive, true);
  } finally { fixture.restore(); }
});

test("cancelled or completed departure cannot be reactivated", async () => {
  for (const status of ["CANCELLED", "COMPLETED"]) {
    const fixture = installFixture({ departure: makeDeparture({ status, isActive: false }) });
    try { await rejectsCode(invoke(toggleTripDepartureActiveService), "TRIP_DEPARTURE_REACTIVATE_FORBIDDEN"); }
    finally { fixture.restore(); }
  }
});

test("lifecycle audit stores compact metadata instead of full snapshots", async () => {
  const fixture = installFixture();
  try {
    await invoke(scheduleTripDepartureService);
    const audit = fixture.audits.at(-1);
    assert.equal(audit.before, null);
    assert.equal(audit.after, null);
    assert.deepEqual(
      { fromStatus: audit.metadata.fromStatus, toStatus: audit.metadata.toStatus },
      { fromStatus: "DRAFT", toStatus: "SCHEDULED" },
    );
  } finally { fixture.restore(); }
});
