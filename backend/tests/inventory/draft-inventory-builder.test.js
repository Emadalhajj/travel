import assert from "node:assert/strict";
import test from "node:test";

import { buildInventoryRequirementsFromDraft } from "../../services/draft-bookings/draft-inventory-builder.js";
import { INVENTORY_RESERVATION_MODES } from "../../constants/inventory/inventory-reservation-modes.js";
import { INVENTORY_TYPES } from "../../constants/inventory/inventory-types.js";

const dates = {
  startDate: "2026-10-01",
  endDate: "2026-10-05",
};

const travelers = (count) =>
  Array.from({ length: count }, (_, index) => ({ name: `Traveler ${index + 1}` }));

const product = (type, overrides = {}) => ({
  type,
  refId: `${type}-id`,
  ...overrides,
});

const buildDraft = ({
  travelersCount = 1,
  packageType = "CUSTOM_PACKAGE",
  products = [],
  program = { programId: "program-id", ...dates },
} = {}) => ({
  travelers: travelers(travelersCount),
  program,
  data: {
    packageType,
    selectedProducts: products,
  },
});

const reservationOf = (requirements, inventoryType) =>
  requirements.inventoryReservations.find(
    (reservation) => reservation.inventoryType === inventoryType,
  );

test("program reservation uses the number of travelers", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({ travelersCount: 3 }),
  });

  assert.deepEqual(result.programReservation, {
    programId: "program-id",
    seats: 3,
  });
});

test("room reservation preserves its unit quantity", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      products: [product("room", { quantity: 2, checkIn: dates.startDate, checkOut: dates.endDate })],
    }),
  });

  const room = reservationOf(result, INVENTORY_TYPES.ROOM_TYPE);
  assert.equal(room.quantity, 2);
  assert.equal(room.reservationMode, INVENTORY_RESERVATION_MODES.PERIOD);
});

test("TripDeparture produces one SINGLE inventory reservation", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 3,
      products: [product("flight", {
        tripId: "trip-id",
        departureId: "departure-id",
        departureAt: "2026-10-02T08:00:00.000Z",
        capacity: { totalSeats: 40 },
        chargeType: "PER_TRAVELER",
      })],
    }),
  });
  const departure = reservationOf(result, INVENTORY_TYPES.TRIP_DEPARTURE);

  assert.deepEqual(departure, {
    inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
    reservationMode: INVENTORY_RESERVATION_MODES.SINGLE,
    itemId: "departure-id",
    date: "2026-10-02T08:00:00.000Z",
    quantity: 3,
    defaultTotal: 0,
  });
  assert.equal(
    result.inventoryReservations.some(({ inventoryType }) => inventoryType === "trip"),
    false,
  );
});

test("new Draft with tripId but no departureId is rejected", () => {
  assert.throws(
    () => buildInventoryRequirementsFromDraft({
      draft: buildDraft({
        travelersCount: 4,
        products: [product("trip", {
          tripId: "trip-id",
          chargeType: "PER_TRAVELER",
          travelDate: dates.startDate,
          returnDate: dates.endDate,
        })],
      }),
    }),
    ({ code, field }) =>
      code === "TRIP_DEPARTURE_DATA_INCOMPLETE" &&
      field === "trip.departureId",
  );
});

test("transport PER_BOOKING uses one unit", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 5,
      products: [product("transport", { chargeType: "PER_BOOKING", startDate: dates.startDate, endDate: dates.endDate })],
    }),
  });

  assert.equal(reservationOf(result, "transport").quantity, 1);
});

test("transport PER_TRAVELER uses traveler count", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 5,
      products: [product("transport", { chargeType: "PER_TRAVELER", startDate: dates.startDate, endDate: dates.endDate })],
    }),
  });

  assert.equal(reservationOf(result, "transport").quantity, 5);
});

test("visa PER_TRAVELER uses traveler count and program dates", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 3,
      products: [product("visa", { chargeType: "PER_TRAVELER" })],
    }),
  });
  const visa = reservationOf(result, "visa");

  assert.equal(visa.quantity, 3);
  assert.equal(visa.startDate, dates.startDate);
  assert.equal(visa.endDate, dates.endDate);
});

test("missing resources do not create inventory reservations", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({ products: [], program: null }),
  });

  assert.equal(result.programReservation, null);
  assert.deepEqual(result.inventoryReservations, []);
});

test("ready and custom packages produce the same requirements for equal resources", () => {
  const products = [
    product("room", { quantity: 2 }),
    product("trip", {
      tripId: "trip-id",
      departureId: "departure-id",
      departureAt: "2026-10-02T08:00:00.000Z",
      chargeType: "PER_TRAVELER",
    }),
    product("transport", { chargeType: "PER_BOOKING" }),
    product("visa", { chargeType: "PER_TRAVELER" }),
  ];
  const ready = buildInventoryRequirementsFromDraft({
    draft: buildDraft({ travelersCount: 3, packageType: "READY_PACKAGE", products }),
  });
  const custom = buildInventoryRequirementsFromDraft({
    draft: buildDraft({ travelersCount: 3, packageType: "CUSTOM_PACKAGE", products }),
  });

  assert.deepEqual(ready, custom);
});
