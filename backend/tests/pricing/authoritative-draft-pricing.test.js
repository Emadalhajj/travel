import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import ExtraService from "../../models/extra-services/extra-service-model.js";
import UmrahProgram from "../../models/umrah-programs/umrah-program-model.js";
import {
  buildAuthoritativeDraftQuote,
  pricingQuoteChanged,
} from "../../services/pricing/draft-pricing-service.js";

const mockFindOne = (Model, value) => {
  const original = Model.findOne;
  Model.findOne = () => ({ lean: async () => value });
  return () => { Model.findOne = original; };
};

test("client unitPrice, subtotal, tax, discount and total are ignored", async () => {
  const id = new mongoose.Types.ObjectId();
  const restore = mockFindOne(ExtraService, {
    _id: id,
    pricing: { basePrice: 100, currency: "SAR" },
    pricingPolicy: {
      tax: { enabled: true, rate: 5, inclusive: false },
      discount: { enabled: true, type: "PERCENTAGE", value: 10 },
      couponEligible: true,
    },
  });
  try {
    const quote = await buildAuthoritativeDraftQuote({
      draft: {
        bookingContext: "CUSTOM_PACKAGE",
        travelers: [{}, {}],
        pricing: { subtotal: 1, taxAmount: 1, discount: 99, total: 1 },
        data: { selectedProducts: [{ type: "extraService", productId: id, unitPrice: 1, priceAtTime: 1 }] },
      },
    });
    assert.equal(quote.subtotal, 200);
    assert.equal(quote.adminDiscountAmount, 20);
    assert.equal(quote.taxAmount, 9);
    assert.equal(quote.total, 189);
  } finally { restore(); }
});

test("ready package uses administrative DB selling price", async () => {
  const id = new mongoose.Types.ObjectId();
  const restore = mockFindOne(UmrahProgram, {
    _id: id,
    pricing: { basePrice: 500, finalPrice: 1, currency: "SAR" },
    pricingPolicy: { tax: { enabled: false, rate: 0, inclusive: false } },
  });
  try {
    const quote = await buildAuthoritativeDraftQuote({
      draft: {
        bookingContext: "READY_PACKAGE",
        travelers: [{}, {}],
        data: { selectedPackage: { _id: id, priceAtTime: 1 } },
      },
    });
    assert.equal(quote.subtotal, 1000);
  } finally { restore(); }
});

test("external flight remains provider-authoritative with no local VAT", async () => {
  const quote = await buildAuthoritativeDraftQuote({
    draft: {
      trip: { external: { provider: "DUFFEL", offerId: "off_1", pricing: { total: 750, currency: "SAR" } } },
    },
  });
  assert.equal(quote.total, 750);
  assert.equal(quote.taxAmount, 0);
  assert.equal(quote.lines[0].sourceType, "EXTERNAL_FLIGHT");
});

test("unavailable product is rejected instead of trusting its client snapshot", async () => {
  const id = new mongoose.Types.ObjectId();
  const restore = mockFindOne(ExtraService, null);
  try {
    await assert.rejects(
      buildAuthoritativeDraftQuote({ draft: { data: { selectedProducts: [{ type: "extraService", productId: id, price: 1 }] } } }),
      (error) => error.code === "PRICING_PRODUCT_UNAVAILABLE",
    );
  } finally { restore(); }
});

const quoteFixture = (overrides = {}) => ({
  version: 2,
  currency: "SAR",
  lines: [{
    sourceType: "EXTRA_SERVICE",
    sourceId: "product-1",
    chargeType: "PER_UNIT",
    unitPrice: 100,
    quantity: 1,
    subtotal: 100,
    adminDiscount: { type: "PERCENTAGE", value: 0, amount: 0, applied: false },
    couponDiscountAmount: 0,
    taxableAmount: 100,
    tax: { enabled: true, rate: 5, inclusive: false, amount: 5 },
    total: 105,
  }],
  coupon: null,
  subtotal: 100,
  adminDiscountAmount: 0,
  couponDiscountAmount: 0,
  taxableAmount: 100,
  taxAmount: 5,
  total: 105,
  ...overrides,
});

test("price revalidation detects a product price change", () => {
  const previous = quoteFixture();
  const next = quoteFixture({
    subtotal: 110,
    taxableAmount: 110,
    taxAmount: 5.5,
    total: 115.5,
    lines: [{ ...previous.lines[0], unitPrice: 110, subtotal: 110, taxableAmount: 110, total: 115.5 }],
  });
  assert.equal(pricingQuoteChanged(previous, next), true);
});

test("price revalidation detects tax policy changes even when totals match", () => {
  const previous = quoteFixture();
  const next = quoteFixture({
    lines: [{ ...previous.lines[0], tax: { enabled: true, rate: 7.5, inclusive: true, amount: 7.33 } }],
  });
  assert.equal(pricingQuoteChanged(previous, next), true);
});

test("price revalidation detects admin discount and coupon changes", () => {
  const previous = quoteFixture();
  const changedDiscount = quoteFixture({
    lines: [{ ...previous.lines[0], adminDiscount: { type: "FIXED", value: 5, amount: 5, applied: true } }],
  });
  const changedCoupon = quoteFixture({
    coupon: { couponId: "coupon-1", code: "SAVE", discountType: "FIXED", value: 5 },
  });
  assert.equal(pricingQuoteChanged(previous, changedDiscount), true);
  assert.equal(pricingQuoteChanged(previous, changedCoupon), true);
  assert.equal(pricingQuoteChanged(previous, structuredClone(previous)), false);
});
