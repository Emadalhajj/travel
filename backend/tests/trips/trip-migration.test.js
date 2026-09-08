import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLegacyMigrationPlan,
  classifyLegacyTrip,
  migrationKeyForTrip,
} from "../../scripts/migrations/trips/trip-migration-lib.js";

const trip = (overrides = {}) => ({
  _id: "64b000000000000000000001",
  tripType: "transport",
  startDate: "2030-01-01T08:00:00.000Z",
  duration: { days: 1 },
  capacity: { totalSeats: 10 },
  pricing: { basePrice: 100, currency: "SAR" },
  isActive: true,
  ...overrides,
});

test("legacy trip classification maps safe types and never guesses package", () => {
  assert.deepEqual(classifyLegacyTrip(trip()).mapping, {
    type: "LAND",
    subtype: "TRANSPORT",
  });
  assert.equal(classifyLegacyTrip(trip({ tripType: "tour" })).mapping.subtype, "TOUR");
  assert.equal(classifyLegacyTrip(trip({ tripType: "activity" })).mapping.subtype, "ACTIVITY");
  assert.equal(classifyLegacyTrip(trip({ tripType: "package" })).status, "MANUAL_REVIEW");
});

test("migration requires reliable date and capacity", () => {
  assert.equal(classifyLegacyTrip(trip({ startDate: null })).status, "MANUAL_REVIEW");
  assert.equal(classifyLegacyTrip(trip({ capacity: { totalSeats: 0 } })).status, "MANUAL_REVIEW");
});

test("migration plan recomputes available and has a deterministic key", () => {
  const plan = buildLegacyMigrationPlan({
    trip: trip(),
    inventoryRows: [{ total: 10, reserved: 3, blocked: 2 }],
    now: new Date("2029-01-01T00:00:00.000Z"),
  });

  assert.equal(plan.departure.migration.key, migrationKeyForTrip(trip()._id));
  assert.equal(plan.inventory.available, 5);
  assert.equal(plan.departure.status, "SCHEDULED");
});

test("migration reports inconsistent or ambiguous inventory for review", () => {
  assert.equal(buildLegacyMigrationPlan({
    trip: trip(),
    inventoryRows: [{ total: 2, reserved: 3, blocked: 0 }],
  }).classification.status, "INVENTORY_INCONSISTENT");

  assert.equal(buildLegacyMigrationPlan({
    trip: trip(),
    inventoryRows: [{ total: 10 }, { total: 10 }],
  }).classification.status, "MANUAL_REVIEW");
});
