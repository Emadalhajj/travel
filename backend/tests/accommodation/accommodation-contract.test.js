import test from "node:test";
import assert from "node:assert/strict";

import { normalizeServiceType } from "../../constants/booking/service-types.js";
import { calculateStayNights } from "../../utils/dates/calculateStayNights.js";
import { updateDraftBookingValidation } from "../../services/validators/draft-bookings/draft-booking-validation.js";
import { PAYMENT_SECTION_CODES } from "../../constants/payments/payment-section-codes.js";
import { resolveDraftPaymentSectionCode } from "../../services/payment/initialize-public-payment-service.js";
import { getFulfillmentSteps } from "../../constants/booking/booking-fulfillment.js";
import { buildBookingItemsFromDraft } from "../../services/draft-bookings/draft-booking-service.js";

const ROOM_TYPE_ID = "507f1f77bcf86cd799439011";

const accommodationPayload = (overrides = {}) => ({
  bookingContext: "SERVICE",
  serviceType: "ACCOMMODATION",
  hotel: {
    roomTypeId: ROOM_TYPE_ID,
    checkIn: "2026-10-01",
    checkOut: "2026-10-06",
    roomsCount: 1,
    adults: 1,
    children: 0,
    ...overrides,
  },
});

test("normalizes legacy HOTEL while preserving ACCOMMODATION", () => {
  assert.equal(normalizeServiceType("HOTEL"), "ACCOMMODATION");
  assert.equal(normalizeServiceType("ACCOMMODATION"), "ACCOMMODATION");
});

test("accepts canonical and legacy accommodation payloads", () => {
  assert.equal(updateDraftBookingValidation.validate(accommodationPayload()).error, undefined);
  assert.equal(
    updateDraftBookingValidation.validate({
      ...accommodationPayload(),
      serviceType: "HOTEL",
    }).error,
    undefined,
  );
});

test("uses inclusive check-in and exclusive check-out", () => {
  assert.equal(calculateStayNights("2026-10-01", "2026-10-06"), 5);
  assert.equal(calculateStayNights("2026-10-01", "2026-10-01"), 0);
  assert.equal(calculateStayNights("2026-10-02", "2026-10-01"), 0);
});

test("rejects invalid stay and occupancy values", () => {
  for (const invalidHotel of [
    { checkOut: "2026-10-01" },
    { checkOut: "2026-09-30" },
    { roomsCount: 0 },
    { adults: 0 },
  ]) {
    assert.ok(updateDraftBookingValidation.validate(accommodationPayload(invalidHotel)).error);
  }
  assert.equal(
    updateDraftBookingValidation.validate(accommodationPayload({ children: 0 })).error,
    undefined,
  );
});

test("canonical and legacy accommodation use HOTEL_BOOKING payment section", () => {
  for (const serviceType of ["ACCOMMODATION", "HOTEL"]) {
    assert.equal(
      resolveDraftPaymentSectionCode({ bookingContext: "SERVICE", serviceType }),
      PAYMENT_SECTION_CODES.HOTEL_BOOKING,
    );
  }
});

test("canonical and legacy accommodation share one fulfillment workflow", () => {
  assert.strictEqual(getFulfillmentSteps("ACCOMMODATION"), getFulfillmentSteps("HOTEL"));
});

test("booking room snapshot prefers trusted draft accommodation values", () => {
  const bookingItems = buildBookingItemsFromDraft({
    hotel: {
      hotelId: "507f1f77bcf86cd799439012",
      roomTypeId: ROOM_TYPE_ID,
      nameAr: "الفندق الموثوق",
      nameEn: "Trusted Hotel",
      roomTypeNameAr: "الغرفة الموثوقة",
      roomTypeNameEn: "Trusted Room",
      checkIn: new Date("2026-10-01T00:00:00.000Z"),
      checkOut: new Date("2026-10-06T00:00:00.000Z"),
      roomsCount: 2,
      adults: 3,
      children: 1,
      nights: 5,
      mealPlan: "breakfast",
    },
    data: {
      selectedProducts: [{
        type: "room",
        productId: ROOM_TYPE_ID,
        nameAr: "اسم غير موثوق",
        nameEn: "Untrusted name",
      }],
    },
  });

  assert.equal(bookingItems.room.roomNameAr, "الغرفة الموثوقة");
  assert.equal(bookingItems.room.roomNameEn, "Trusted Room");
  assert.equal(bookingItems.room.quantity, 2);
  assert.equal(bookingItems.room.nights, 5);
  assert.equal(bookingItems.room.adults, 3);
  assert.equal(bookingItems.room.children, 1);
});

