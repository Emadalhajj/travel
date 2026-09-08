import test from "node:test";
import assert from "node:assert/strict";

import { createTripSchema } from "../../services/validators/trip-validation.js";

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
