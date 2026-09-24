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

test("standalone accommodation reserves rooms for the full stay as one period", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: {
      _id: "draft-id",
      bookingContext: "SERVICE",
      serviceType: "ACCOMMODATION",
      travelers: travelers(4),
      program: null,
      hotel: {
        hotelId: "hotel-id",
        roomTypeId: "room-type-id",
        checkIn: "2026-10-01",
        checkOut: "2026-10-06",
        roomsCount: 2,
      },
      data: { packageType: "CUSTOM_PACKAGE", selectedProducts: [] },
    },
  });

  assert.equal(result.programReservation, null);
  assert.deepEqual(result.inventoryReservations, [{
    inventoryType: INVENTORY_TYPES.ROOM_TYPE,
    reservationMode: INVENTORY_RESERVATION_MODES.PERIOD,
    itemId: "room-type-id",
    startDate: "2026-10-01",
    endDate: "2026-10-06",
    quantity: 2,
    defaultTotal: 0,
  }]);
});

test("legacy HOTEL draft uses the same accommodation inventory contract", () => {
  const accommodation = {
    bookingContext: "SERVICE",
    serviceType: "HOTEL",
    travelers: travelers(2),
    program: null,
    hotel: {
      hotelId: "hotel-id",
      roomTypeId: "room-type-id",
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
      roomsCount: 1,
    },
    data: { selectedProducts: [] },
  };

  const result = buildInventoryRequirementsFromDraft({ draft: accommodation });
  const room = reservationOf(result, INVENTORY_TYPES.ROOM_TYPE);

  assert.equal(room.itemId, "room-type-id");
  assert.equal(room.quantity, 1);
  assert.equal(room.startDate, "2026-10-01");
  assert.equal(room.endDate, "2026-10-03");
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

test("external flight has no local inventory while mixed local resources remain", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 2,
      products: [
        product("room", {
          quantity: 1,
          checkIn: dates.startDate,
          checkOut: dates.endDate,
        }),
        product("flight", {
          tripId: "trip-id",
          departureId: "departure-id",
          departureAt: "2026-10-02T08:00:00.000Z",
          source: "API",
          external: { provider: "DUFFEL", offerId: "off-1" },
        }),
      ],
    }),
  });

  assert.equal(reservationOf(result, INVENTORY_TYPES.TRIP_DEPARTURE), undefined);
  assert.equal(reservationOf(result, INVENTORY_TYPES.ROOM_TYPE)?.quantity, 1);
  assert.equal(result.programReservation?.seats, 2);
});

test("standalone Duffel draft needs no local trip or departure identity", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: {
      ...buildDraft({ travelersCount: 3, products: [], program: null }),
      trip: {
        source: "API",
        tripId: null,
        departureId: null,
        departureAt: "2026-10-02T08:00:00.000Z",
        external: { provider: "DUFFEL", offerId: "off-1" },
      },
    },
  });

  assert.equal(result.programReservation, null);
  assert.deepEqual(result.inventoryReservations, []);
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
