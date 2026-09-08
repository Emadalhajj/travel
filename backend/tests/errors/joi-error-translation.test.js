import assert from "node:assert/strict";
import test from "node:test";

import { createTripDepartureSchema } from "../../validations/trips/trip-departure-validation.js";
import {
  formatValidationPath,
  translateJoiError,
} from "../../utils/validation/translateJoiError.js";

const invalidPayload = {
  tripId: "64b000000000000000000001",
  departureAt: "2030-01-01T08:00:00.000Z",
  segments: [{ arrivalAt: "" }],
};

test("nested Joi paths use the same bracket notation as array form fields", () => {
  expectPath(formatValidationPath(["segments", 0, "arrivalAt"]));
});

const expectPath = (value) => assert.equal(value, "segments[0].arrivalAt");

test("invalid nested date is translated to Arabic and keeps its field", () => {
  const { error } = createTripDepartureSchema.validate(invalidPayload, {
    abortEarly: false,
  });
  const translated = translateJoiError(error.details[0], "ar");

  expectPath(translated.field);
  assert.equal(
    translated.message,
    'الحقل "segments[0].arrivalAt" يجب أن يكون تاريخًا صحيحًا',
  );
});

test("the same Joi error follows the English request language", () => {
  const { error } = createTripDepartureSchema.validate(invalidPayload);
  const translated = translateJoiError(error.details[0], "en");

  assert.equal(
    translated.message,
    '"segments[0].arrivalAt" must be a valid date',
  );
});
