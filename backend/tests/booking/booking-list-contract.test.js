import assert from "node:assert/strict";
import test from "node:test";

import {
  BOOKING_LIST_PROJECTION,
  bookingDetailsPopulate,
  serializeBookingListItem,
} from "../../controllers/booking/booking-controller.js";

const heavyFields = [
  "pilgrims",
  "hosts",
  "attachments",
  "hotel",
  "roomType",
  "visa",
  "trip",
  "transport",
  "createdBy",
  "updatedBy",
  "bookingItems",
  "data",
];

test("booking list contract contains every field used by booking cards", () => {
  const item = serializeBookingListItem({
    _id: "booking-1",
    bookingNumber: "BK-000001",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    customer: { name: "Traveler", email: "hidden@example.com" },
    program: { nameAr: "برنامج", nameEn: "Program", services: [{ secret: true }] },
    pricing: { totalPrice: 750, currency: "SAR", breakdown: { room: 500 } },
    totalPilgrims: 3,
    createdAt: new Date("2026-08-26T00:00:00.000Z"),
  });

  assert.equal(item._id, "booking-1");
  assert.equal(item.customer.name, "Traveler");
  assert.deepEqual(item.program, { nameAr: "برنامج", nameEn: "Program" });
  assert.deepEqual(item.pricing, {
    total: 750,
    totalPrice: 750,
    currency: "SAR",
  });
  assert.equal(item.pilgrimsCount, 3);
  assert.equal(item.totalPilgrims, 3);
  assert.equal("email" in item.customer, false);
});

test("booking list projection and DTO exclude detail-only relationships", () => {
  for (const field of heavyFields) {
    assert.equal(
      Object.hasOwn(BOOKING_LIST_PROJECTION, field),
      false,
      `${field} must not be selected by booking lists`,
    );
  }

  const item = serializeBookingListItem(Object.fromEntries(
    heavyFields.map((field) => [field, [{ sensitive: true }]]),
  ));
  for (const field of heavyFields) assert.equal(field in item, false);
});

test("booking details keeps its dedicated populate contract", () => {
  assert.deepEqual(
    bookingDetailsPopulate.map(({ path }) => path),
    ["user", "hotel", "roomType", "visa", "trip", "transport", "createdBy", "updatedBy"],
  );
});
