import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import {
  buildAccommodationPricingInput,
  buildAuthoritativeDraftQuote,
  pricingQuoteChanged,
} from "../../services/pricing/draft-pricing-service.js";

const roomTypeId = new mongoose.Types.ObjectId();
const draft = (overrides = {}) => ({
  bookingContext: "SERVICE",
  serviceType: "ACCOMMODATION",
  hotel: {
    roomTypeId,
    checkIn: "2030-10-01",
    checkOut: "2030-10-06",
    roomsCount: 1,
    adults: 1,
    children: 0,
    ...overrides,
  },
  data: {
    selectedProducts: [{
      type: "ROOM_TYPE",
      productId: roomTypeId,
      quantity: overrides.roomsCount || 1,
      unitPrice: 1,
      total: 1,
    }],
  },
});

const room = (overrides = {}) => ({
  _id: roomTypeId,
  pricing: {
    basePrice: 300,
    currency: "SAR",
    pricingPeriods: [],
    ...(overrides.pricing || {}),
  },
  pricingPolicy: {
    tax: { enabled: false, rate: 0, inclusive: false },
    discount: { enabled: false, type: "PERCENTAGE", value: 0 },
    couponEligible: true,
    ...(overrides.pricingPolicy || {}),
  },
});

const modelFor = (value) => ({
  findOne: () => ({ lean: async () => value }),
});

const withRoomType = async (value, worker) => {
  const RoomType = (await import("../../models/hotels/roomType-model.js")).default;
  const original = RoomType.findOne;
  RoomType.findOne = () => ({ lean: async () => value });
  try { return await worker(); } finally { RoomType.findOne = original; }
};

test("builds one-night and equal multi-night authoritative subtotals", async () => {
  const oneNight = await buildAccommodationPricingInput(
    draft({ checkOut: "2030-10-02" }),
    { RoomTypeModel: modelFor(room()) },
  );
  assert.equal(oneNight.unitPrice, 300);
  assert.equal(oneNight.breakdown.nights, 1);

  const fiveNights = await buildAccommodationPricingInput(
    draft(),
    { RoomTypeModel: modelFor(room()) },
  );
  assert.equal(fiveNights.unitPrice, 1500);
  assert.equal(fiveNights.breakdown.nightlyRates.length, 5);
  assert.equal(fiveNights.breakdown.nightlyRates.at(-1).date, "2030-10-05");
});

test("resolves every night across pricing periods and multiplies rooms", async () => {
  const product = room({
    pricing: {
      basePrice: 300,
      currency: "SAR",
      pricingPeriods: [
        {
          _id: new mongoose.Types.ObjectId(),
          isActive: true,
          periodType: "seasonal",
          startDate: "2030-10-03",
          endDate: "2030-10-04",
          price: 450,
          priority: 1,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          isActive: true,
          periodType: "custom",
          startDate: "2030-10-05",
          endDate: "2030-10-05",
          price: 350,
          priority: 1,
        },
      ],
    },
  });
  const input = await buildAccommodationPricingInput(
    draft({ roomsCount: 2 }),
    { RoomTypeModel: modelFor(product) },
  );
  assert.deepEqual(input.breakdown.nightlyRates.map(({ rate }) => rate), [300, 300, 450, 450, 350]);
  assert.equal(input.unitPrice, 1850);
  assert.equal(input.quantity, 2);
  await withRoomType(product, async () => {
    const quote = await buildAuthoritativeDraftQuote({ draft: draft({ roomsCount: 2 }) });
    assert.equal(quote.subtotal, 3700);
    assert.equal(quote.lines[0].breakdown.nightlyRates.length, 5);
  });
});

test("reuses V2 discount, coupon and exclusive tax after nightly subtotal", async () => {
  const product = room({ pricingPolicy: {
    tax: { enabled: true, rate: 10, inclusive: false },
    discount: { enabled: true, type: "PERCENTAGE", value: 10 },
    couponEligible: true,
  } });
  await withRoomType(product, async () => {
    const quote = await buildAuthoritativeDraftQuote({
      draft: draft({ checkOut: "2030-10-03" }),
      coupon: { code: "SAVE", discountType: "FIXED", value: 40 },
    });
    assert.equal(quote.subtotal, 600);
    assert.equal(quote.adminDiscountAmount, 60);
    assert.equal(quote.couponDiscountAmount, 40);
    assert.equal(quote.taxAmount, 50);
    assert.equal(quote.total, 550);
  });
});

test("supports fixed admin discount and inclusive tax without adding tax twice", async () => {
  const product = room({ pricingPolicy: {
    tax: { enabled: true, rate: 20, inclusive: true },
    discount: { enabled: true, type: "FIXED", value: 100 },
    couponEligible: false,
  } });
  await withRoomType(product, async () => {
    const quote = await buildAuthoritativeDraftQuote({
      draft: draft({ checkOut: "2030-10-03" }),
    });
    assert.equal(quote.subtotal, 600);
    assert.equal(quote.adminDiscountAmount, 100);
    assert.equal(quote.taxableAmount, 500);
    assert.equal(quote.taxAmount, 83.33);
    assert.equal(quote.total, 500);
  });
});

test("ignores frontend money and detects a changed nightly rate", async () => {
  let product = room();
  const previous = await withRoomType(product, () =>
    buildAuthoritativeDraftQuote({ draft: draft({ checkOut: "2030-10-03" }) }));
  assert.equal(previous.subtotal, 600);

  product = room({ pricing: {
    basePrice: 300,
    currency: "SAR",
    pricingPeriods: [{
      isActive: true,
      periodType: "custom",
      startDate: "2030-10-02",
      endDate: "2030-10-02",
      price: 400,
      priority: 1,
    }],
  } });
  const next = await withRoomType(product, () =>
    buildAuthoritativeDraftQuote({ draft: draft({ checkOut: "2030-10-03" }) }));
  assert.equal(next.subtotal, 700);
  assert.equal(pricingQuoteChanged(previous, next), true);
});

