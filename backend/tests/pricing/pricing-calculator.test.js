import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePricingLine,
  calculatePricingQuote,
} from "../../services/pricing/pricing-calculator.js";
import { readPricingSnapshot } from "../../services/pricing/legacy-pricing-adapter.js";

const line = (overrides = {}) => ({
  sourceType: "TEST",
  chargeType: "PER_UNIT",
  unitPrice: 1000,
  quantity: 1,
  currency: "SAR",
  adminDiscount: { enabled: false, value: 0 },
  tax: { enabled: false, rate: 0, inclusive: false },
  ...overrides,
});

test("calculates no discount and no tax", () => {
  assert.equal(calculatePricingLine(line()).total, 1000);
});

test("applies percentage admin discount", () => {
  const result = calculatePricingLine(line({
    adminDiscount: { enabled: true, type: "PERCENTAGE", value: 10 },
  }));
  assert.equal(result.adminDiscount.amount, 100);
  assert.equal(result.total, 900);
});

test("applies fixed admin discount", () => {
  assert.equal(calculatePricingLine(line({
    adminDiscount: { enabled: true, type: "FIXED", value: 100 },
  })).total, 900);
});

test("adds exclusive manual tax", () => {
  assert.equal(calculatePricingLine(line({
    tax: { enabled: true, rate: 15, inclusive: false },
  })).total, 1150);
});

test("applies discount before exclusive tax", () => {
  const result = calculatePricingLine(line({
    adminDiscount: { enabled: true, type: "PERCENTAGE", value: 10 },
    tax: { enabled: true, rate: 15, inclusive: false },
  }));
  assert.equal(result.tax.amount, 135);
  assert.equal(result.total, 1035);
});

test("extracts inclusive tax without adding it", () => {
  const result = calculatePricingLine(line({
    tax: { enabled: true, rate: 15, inclusive: true },
  }));
  assert.equal(result.tax.amount, 130.43);
  assert.equal(result.total, 1000);
});

test("discounted inclusive price stays inclusive", () => {
  const result = calculatePricingLine(line({
    adminDiscount: { enabled: true, type: "PERCENTAGE", value: 10 },
    tax: { enabled: true, rate: 15, inclusive: true },
  }));
  assert.equal(result.tax.amount, 117.39);
  assert.equal(result.total, 900);
});

test("supports 7.5 percent and zero tax rates", () => {
  assert.equal(calculatePricingLine(line({
    tax: { enabled: true, rate: 7.5, inclusive: false },
  })).total, 1075);
  assert.equal(calculatePricingLine(line({
    tax: { enabled: true, rate: 0, inclusive: false },
  })).total, 1000);
});

test("does not apply expired discount", () => {
  const result = calculatePricingLine(line({
    adminDiscount: {
      enabled: true,
      type: "FIXED",
      value: 100,
      expiresAt: "2025-01-01T00:00:00.000Z",
    },
  }), { now: new Date("2026-01-01T00:00:00.000Z") });
  assert.equal(result.adminDiscount.amount, 0);
  assert.equal(result.total, 1000);
});

test("caps fixed discount and allows decimal quantities", () => {
  assert.equal(calculatePricingLine(line({
    unitPrice: 10,
    quantity: 1.25,
    adminDiscount: { enabled: true, type: "FIXED", value: 100 },
  })).total, 0);
});

test("rounds monetary boundaries deterministically with the shared roundPrice", () => {
  const result = calculatePricingLine(line({
    unitPrice: 0.1,
    quantity: 3,
    tax: { enabled: true, rate: 7.5, inclusive: false },
  }));
  assert.equal(result.subtotal, 0.3);
  assert.equal(result.tax.amount, 0.02);
  assert.equal(result.total, 0.32);
});

test("rejects invalid percentage", () => {
  assert.throws(
    () => calculatePricingLine(line({
      adminDiscount: { enabled: true, type: "PERCENTAGE", value: 101 },
    })),
    (error) => error.code === "PRICING_PERCENTAGE_INVALID",
  );
});

test("aggregates lines with different tax policies", () => {
  const quote = calculatePricingQuote([
    line({ unitPrice: 100, tax: { enabled: true, rate: 15, inclusive: false } }),
    line({ unitPrice: 100, tax: { enabled: true, rate: 5, inclusive: false } }),
    line({ unitPrice: 100 }),
  ]);
  assert.equal(quote.version, 2);
  assert.equal(quote.subtotal, 300);
  assert.equal(quote.taxAmount, 20);
  assert.equal(quote.total, 320);
  assert.equal(quote.coupon, null);
});

test("rejects mixed currencies", () => {
  assert.throws(
    () => calculatePricingQuote([line(), line({ currency: "USD" })]),
    (error) => error.code === "PRICING_CURRENCY_MISMATCH",
  );
});

test("reads legacy total and totalPrice without recalculation", () => {
  assert.equal(readPricingSnapshot({ total: 120, currency: "SAR" }).total, 120);
  assert.equal(readPricingSnapshot({ totalPrice: 140, currency: "SAR" }).total, 140);
});

test("legacy reader ignores zero-valued schema aliases for historical totals", () => {
  assert.equal(readPricingSnapshot({ total: 140, totalPrice: 0 }).total, 140);
  assert.equal(readPricingSnapshot({ total: 0, totalPrice: 160 }).total, 160);
});

test("preserves version 2 snapshots", () => {
  const snapshot = { version: 2, currency: "SAR", lines: [], total: 25 };
  assert.equal(readPricingSnapshot(snapshot), snapshot);
});
