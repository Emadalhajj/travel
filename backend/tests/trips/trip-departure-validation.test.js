import test from "node:test";
import assert from "node:assert/strict";

import {
  createTripDepartureSchema,
  updateTripDepartureSchema,
} from "../../validations/trips/trip-departure-validation.js";

const tripId = "64b000000000000000000001";

test("accepts a valid TripDeparture and applies shared defaults", () => {
  const { value, error } = createTripDepartureSchema.validate({
    tripId,
    departureAt: "2026-09-10T03:55:00.000Z",
    arrivalAt: "2026-09-10T06:45:00.000Z",
    pricing: { basePrice: 500 },
  });

  assert.equal(error, undefined);
  assert.equal(value.pricing.currency, "SAR");
  assert.deepEqual(value.segments, []);
});

test("rejects arrival before the departure", () => {
  const { error } = createTripDepartureSchema.validate({
    tripId,
    departureAt: "2026-09-10T06:45:00.000Z",
    arrivalAt: "2026-09-10T03:55:00.000Z",
  });

  assert.ok(error);
  assert.equal(error.details[0].path.join("."), "arrivalAt");
});

test("rejects arrival equal to departure", () => {
  const { error } = createTripDepartureSchema.validate({
    tripId,
    departureAt: "2026-09-10T03:55:00.000Z",
    arrivalAt: "2026-09-10T03:55:00.000Z",
  });

  assert.ok(error);
  assert.equal(error.details[0].path.join("."), "arrivalAt");
});

test("rejects a malformed tripId before reaching the service", () => {
  const { error } = createTripDepartureSchema.validate({
    tripId: "not-an-object-id",
    departureAt: "2026-09-10T03:55:00.000Z",
  });

  assert.ok(error);
  assert.equal(error.details[0].path.join("."), "tripId");
});

test("rejects invalid dates inside an individual segment", () => {
  const { error } = createTripDepartureSchema.validate({
    tripId,
    departureAt: "2026-09-10T03:55:00.000Z",
    segments: [{
      departureAt: "2026-09-10T06:45:00.000Z",
      arrivalAt: "2026-09-10T03:55:00.000Z",
    }],
  });

  assert.ok(error);
  assert.equal(
    error.details[0].message,
    "وقت وصول المقطع يجب أن يكون بعد وقت المغادرة",
  );
});

test("keeps every field optional in the PATCH schema", () => {
  const { value, error } = updateTripDepartureSchema.validate({
    notesAr: "تحديث الملاحظة فقط",
  });

  assert.equal(error, undefined);
  assert.equal(value.notesAr, "تحديث الملاحظة فقط");
});
