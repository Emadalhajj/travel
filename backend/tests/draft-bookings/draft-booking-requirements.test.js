import assert from "node:assert/strict";
import test from "node:test";

import {
  draftRequiresTravelers,
} from "../../services/draft-bookings/draft-booking-service.js";

test("extra-service booking does not require travelers", () => {
  assert.equal(
    draftRequiresTravelers({
      bookingContext: "SERVICE",
      serviceType: "EXTRA_SERVICE",
    }),
    false,
  );
});

test("traveler-based service bookings still require travelers", () => {
  for (const serviceType of [
    "FLIGHT",
    "TRIP",
    "HOTEL",
    "TRANSPORT",
    "VISA",
    "ZIYARAT",
  ]) {
    assert.equal(
      draftRequiresTravelers({
        bookingContext: "SERVICE",
        serviceType,
      }),
      true,
      serviceType,
    );
  }
});

test("package bookings still require travelers", () => {
  assert.equal(
    draftRequiresTravelers({
      bookingContext: "CUSTOM_PACKAGE",
    }),
    true,
  );
  assert.equal(
    draftRequiresTravelers({
      bookingContext: "READY_PACKAGE",
    }),
    true,
  );
});
