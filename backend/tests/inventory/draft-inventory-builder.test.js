import assert from "node:assert/strict";
import test from "node:test";

import { buildInventoryRequirementsFromDraft } from "../../services/draft-bookings/draft-inventory-builder.js";

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

  assert.equal(reservationOf(result, "roomType").quantity, 2);
});

test("trip PER_TRAVELER uses traveler count", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 4,
      products: [product("trip", { chargeType: "PER_TRAVELER", travelDate: dates.startDate, returnDate: dates.endDate })],
    }),
  });

  assert.equal(reservationOf(result, "trip").quantity, 4);
});

test("trip PER_UNIT preserves selected quantity", () => {
  const result = buildInventoryRequirementsFromDraft({
    draft: buildDraft({
      travelersCount: 4,
      products: [product("trip", { chargeType: "PER_UNIT", quantity: 2, travelDate: dates.startDate, returnDate: dates.endDate })],
    }),
  });

  assert.equal(reservationOf(result, "trip").quantity, 2);
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
    product("trip", { chargeType: "PER_TRAVELER" }),
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
