import test from "node:test";
import assert from "node:assert/strict";

import Trip from "../../models/transportition/trip-model.js";
import {
  buildTripSort,
  getTripByIdService,
} from "../../services/trips/trip-service.js";

test("buildTripSort maps approved admin sort values", () => {
  assert.deepEqual(buildTripSort("pricing.basePrice_asc"), {
    "pricing.basePrice": 1,
  });
  assert.deepEqual(buildTripSort("pricing.basePrice_desc"), {
    "pricing.basePrice": -1,
  });
  assert.deepEqual(buildTripSort("createdAt_asc"), { createdAt: 1 });
  assert.deepEqual(buildTripSort("createdAt_desc"), { createdAt: -1 });
});

test("buildTripSort safely rejects unsupported fields", () => {
  assert.deepEqual(buildTripSort("pricing.currency_asc"), { createdAt: -1 });
  assert.deepEqual(buildTripSort(), { createdAt: -1 });
});

test("getTripByIdService does not depend on list query variables", async (t) => {
  const originalFindOne = Trip.findOne;
  const trip = {
    _id: "64b000000000000000000001",
    async populate() { return this; },
  };
  const mongooseQuery = {
    populate() { return mongooseQuery; },
    then(onFulfilled, onRejected) {
      return Promise.resolve(trip).then(onFulfilled, onRejected);
    },
  };

  Trip.findOne = (filter) => {
    assert.deepEqual(filter, {
      _id: trip._id,
      isDeleted: false,
    });
    return mongooseQuery;
  };
  t.after(() => { Trip.findOne = originalFindOne; });

  assert.equal(await getTripByIdService(trip._id), trip);
});
