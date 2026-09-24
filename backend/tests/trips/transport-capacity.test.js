import assert from "node:assert/strict";
import test from "node:test";

import {
  assertTransportCapacity,
  assertTransportCapacityCanBeReduced,
} from "../../services/transports/transport-capacity-service.js";

test("transport capacity accepts an equal passenger count and rejects overflow", () => {
  assert.doesNotThrow(() => assertTransportCapacity({
    passengersCount: 40,
    transport: { capacity: 40 },
  }));
  assert.throws(
    () => assertTransportCapacity({ passengersCount: 45, transport: { capacity: 40 } }),
    (error) => error.code === "TRIP_TRANSPORT_CAPACITY_EXCEEDED" &&
      error.field === "capacity.totalSeats" &&
      error.params.transportCapacity === 40,
  );
});

test("transport capacity cannot be reduced below a linked future departure", async () => {
  const TripModel = {
    find: () => ({ select: () => ({ lean: async () => [{ _id: "trip-1" }] }) }),
  };
  const TripDepartureModel = {
    findOne: () => ({
      select: () => ({ lean: async () => ({ capacity: { totalSeats: 45 } }) }),
    }),
  };
  await assert.rejects(
    assertTransportCapacityCanBeReduced({
      transportId: "transport-1",
      nextCapacity: 30,
      TripModel,
      TripDepartureModel,
    }),
    (error) => error.code === "TRANSPORT_CAPACITY_BELOW_FUTURE_TRIPS" &&
      error.field === "capacity",
  );
});
