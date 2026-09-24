import assert from "node:assert/strict";
import test from "node:test";
import { calculatePricingQuote } from "../../services/pricing/pricing-calculator.js";

const line = (overrides = {}) => ({
  sourceType: "EXTRA_SERVICE",
  sourceId: overrides.sourceId || "a",
  chargeType: "PER_UNIT",
  unitPrice: 100,
  quantity: 1,
  currency: "SAR",
  adminDiscount: { enabled: false, value: 0 },
  tax: { enabled: false, rate: 0, inclusive: false },
  couponEligible: true,
  ...overrides,
});

test("percentage coupon is applied after admin discount and before exclusive tax", () => {
  const quote = calculatePricingQuote([line({
    unitPrice: 1000,
    adminDiscount: { enabled: true, type: "PERCENTAGE", value: 10 },
    tax: { enabled: true, rate: 15, inclusive: false },
  })], { coupon: { code: "SAVE10", discountType: "PERCENTAGE", value: 10 } });
  assert.equal(quote.adminDiscountAmount, 100);
  assert.equal(quote.couponDiscountAmount, 90);
  assert.equal(quote.taxableAmount, 810);
  assert.equal(quote.taxAmount, 121.5);
  assert.equal(quote.total, 931.5);
});

test("fixed coupon is capped at eligible amount", () => {
  const quote = calculatePricingQuote([line()], {
    coupon: { code: "BIG", discountType: "FIXED", value: 500 },
  });
  assert.equal(quote.couponDiscountAmount, 100);
  assert.equal(quote.total, 0);
});

test("coupon ignores ineligible lines", () => {
  const quote = calculatePricingQuote([
    line({ sourceId: "eligible", unitPrice: 100 }),
    line({ sourceId: "blocked", unitPrice: 100, couponEligible: false }),
  ], { coupon: { code: "HALF", discountType: "PERCENTAGE", value: 50 } });
  assert.equal(quote.couponDiscountAmount, 50);
  assert.equal(quote.total, 150);
});

test("fixed coupon allocation is proportional and preserves rounding remainder", () => {
  const quote = calculatePricingQuote([
    line({ sourceId: "a", unitPrice: 600 }),
    line({ sourceId: "b", unitPrice: 400 }),
  ], { coupon: { code: "FIX100", discountType: "FIXED", value: 100 } });
  assert.deepEqual(quote.lines.map((item) => item.couponDiscountAmount), [60, 40]);
  assert.equal(quote.lines.reduce((sum, item) => sum + item.couponDiscountAmount, 0), 100);
});

test("rounding remainder is assigned deterministically to the last eligible line", () => {
  const quote = calculatePricingQuote([
    line({ sourceId: "a", unitPrice: 1 }),
    line({ sourceId: "b", unitPrice: 1 }),
    line({ sourceId: "c", unitPrice: 1 }),
  ], { coupon: { code: "ONE", discountType: "FIXED", value: 1 } });
  assert.deepEqual(quote.lines.map((item) => item.couponDiscountAmount), [0.33, 0.33, 0.34]);
});

test("mixed tax rates are recalculated per line after coupon allocation", () => {
  const quote = calculatePricingQuote([
    line({ sourceId: "a", tax: { enabled: true, rate: 5, inclusive: false } }),
    line({ sourceId: "b", tax: { enabled: true, rate: 15, inclusive: false } }),
  ], { coupon: { code: "FIX20", discountType: "FIXED", value: 20 } });
  assert.equal(quote.taxAmount, 18);
  assert.equal(quote.total, 198);
});

test("inclusive tax is extracted again after coupon without being added twice", () => {
  const quote = calculatePricingQuote([line({
    unitPrice: 115,
    tax: { enabled: true, rate: 15, inclusive: true },
  })], { coupon: { code: "FIX15", discountType: "FIXED", value: 15 } });
  assert.equal(quote.total, 100);
  assert.equal(quote.taxAmount, 13.04);
});

test("coupon product allowlist limits allocation", () => {
  const quote = calculatePricingQuote([
    line({ sourceId: "a", unitPrice: 100 }),
    line({ sourceId: "b", unitPrice: 100 }),
  ], { coupon: { code: "AONLY", discountType: "PERCENTAGE", value: 50, eligibleProductIds: ["a"] } });
  assert.deepEqual(quote.lines.map((item) => item.couponDiscountAmount), [50, 0]);
  assert.equal(quote.total, 150);
});

