import assert from "node:assert/strict";
import test from "node:test";

import { calculateBookingPrice } from "../../services/pricing/bookingCalc.js";

const room = (pricingPolicy) => ({
  _id: "room-1",
  capacity: { maxAdults: 2, maxChildren: 2 },
  pricing: { basePrice: 100, currency: "SAR", customPeriods: [] },
  pricingPolicy,
});

const calculate = (pricingPolicy) => calculateBookingPrice({
  roomType: room(pricingPolicy),
  checkIn: "2030-01-01",
  checkOut: "2030-01-02",
  adults: 1,
  children: 0,
});

test("room preview has no implicit VAT", () => {
  const result = calculate(undefined);
  assert.equal(result.summary.taxRate, 0);
  assert.equal(result.summary.taxAmount, 0);
  assert.equal(result.summary.totalPrice, 100);
});

test("room preview honors administrator manual exclusive tax", () => {
  const result = calculate({
    tax: { enabled: true, rate: 7.5, inclusive: false },
    discount: { enabled: false, type: "PERCENTAGE", value: 0 },
  });
  assert.equal(result.summary.taxRate, 7.5);
  assert.equal(result.summary.taxAmount, 7.5);
  assert.equal(result.summary.totalPrice, 107.5);
});

test("room preview uses the shared discount then inclusive-tax rules", () => {
  const result = calculate({
    tax: { enabled: true, rate: 5, inclusive: true },
    discount: { enabled: true, type: "PERCENTAGE", value: 10 },
  });
  assert.equal(result.summary.discountTotal, 10);
  assert.equal(result.summary.subtotal, 100);
  assert.equal(result.summary.taxAmount, 4.29);
  assert.equal(result.summary.totalPrice, 90);
});
