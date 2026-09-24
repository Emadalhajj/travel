import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAgeOnDate,
  getPassengerTypeByAge,
  validatePassengerAge,
} from "../../utils/passengers/passenger-age.js";

test("passenger age uses completed years on the first travel date", () => {
  assert.equal(calculateAgeOnDate("2014-09-15", "2026-09-14"), 11);
  assert.equal(calculateAgeOnDate("2014-09-14", "2026-09-14"), 12);
});

test("passenger categories respect the two and twelve year boundaries", () => {
  assert.equal(getPassengerTypeByAge({
    birthDate: "2024-09-15",
    travelDate: "2026-09-14",
  }), "infant_without_seat");
  assert.equal(getPassengerTypeByAge({
    birthDate: "2024-09-14",
    travelDate: "2026-09-14",
  }), "child");
  assert.equal(getPassengerTypeByAge({
    birthDate: "2014-09-14",
    travelDate: "2026-09-14",
  }), "adult");
});

test("provider passenger category is validated rather than overwritten", () => {
  assert.deepEqual(validatePassengerAge({
    passengerType: "child",
    birthDate: "2010-01-01",
    travelDate: "2026-10-01",
  }), {
    valid: false,
    reason: "PASSENGER_TYPE_MISMATCH",
    expectedType: "child",
    calculatedType: "adult",
  });
});
