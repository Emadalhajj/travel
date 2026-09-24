import test from "node:test";
import assert from "node:assert/strict";

import { createTripSchema } from "../../services/validators/trips/trip-validation.js";

const baseTrip = {
  nameAr: "رحلة برية",
  nameEn: "Land Trip",
  type: "LAND",
  scope: "DOMESTIC",
  subtype: "TRANSPORT",
  pricing: { basePrice: 100, currency: "SAR" },
};

test("land trips require a transport reference", () => {
  const { error } = createTripSchema.validate(baseTrip, { abortEarly: false });
  assert.equal(error?.details.some(({ path }) => path.join(".") === "transportId"), true);
});

test("land trips accept a valid transport reference", () => {
  const { error } = createTripSchema.validate({
    ...baseTrip,
    transportId: "64b000000000000000000001",
  }, { abortEarly: false });
  assert.equal(error, undefined);
});

test("trip names enforce their configured language and allow uppercase acronyms in Arabic", () => {
  const valid = createTripSchema.validate({
    ...baseTrip,
    nameAr: "رحلة VIP مكة",
    transportId: "64b000000000000000000001",
  }, { abortEarly: false });
  assert.equal(valid.error, undefined);

  const invalid = createTripSchema.validate({
    ...baseTrip,
    nameAr: "Makkah Trip",
    nameEn: "رحلة مكة",
    transportId: "64b000000000000000000001",
  }, { abortEarly: false });
  assert.equal(invalid.error?.details.some(({ path }) => path.join(".") === "nameAr"), true);
  assert.equal(invalid.error?.details.some(({ path }) => path.join(".") === "nameEn"), true);
});
