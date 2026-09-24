import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import Coupon from "../../models/pricing/coupon-model.js";
import ExtraService from "../../models/extra-services/extra-service-model.js";
import {
  applyCouponToDraft,
  consumeDraftCoupon,
  removeCouponFromDraft,
  resolveCouponForDraft,
} from "../../services/pricing/coupon-service.js";

const userId = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId();
const couponId = new mongoose.Types.ObjectId();

const draftFixture = () => ({
  bookingContext: "CUSTOM_PACKAGE",
  serviceType: "EXTRA_SERVICE",
  user: userId,
  travelers: [{}],
  data: { selectedProducts: [{ type: "extraService", productId }] },
  pricing: {},
  saveCalls: 0,
  async save() { this.saveCalls += 1; return this; },
});

const couponFixture = (overrides = {}) => ({
  _id: couponId,
  code: "SAVE10",
  discountType: "PERCENTAGE",
  value: 10,
  isActive: true,
  isDeleted: false,
  startsAt: null,
  expiresAt: null,
  minimumAmount: 0,
  usageLimit: 10,
  usageCount: 0,
  perCustomerLimit: 1,
  applicableTo: { scope: "ALL", serviceTypes: [], productIds: [] },
  usageRecords: [],
  ...overrides,
});

const productFixture = (overrides = {}) => ({
  _id: productId,
  pricing: { basePrice: 100, currency: "SAR" },
  pricingPolicy: {
    tax: { enabled: false, rate: 0, inclusive: false },
    discount: { enabled: false, type: "PERCENTAGE", value: 0 },
    couponEligible: true,
  },
  ...overrides,
});

const mockResolution = ({ coupon = couponFixture(), product = productFixture() } = {}) => {
  const originalCoupon = Coupon.findOne;
  const originalProduct = ExtraService.findOne;
  Coupon.findOne = () => ({ select: () => ({ lean: async () => coupon }) });
  ExtraService.findOne = () => ({ lean: async () => product });
  return () => { Coupon.findOne = originalCoupon; ExtraService.findOne = originalProduct; };
};

test("invalid, inactive, future and expired coupons are rejected", async () => {
  const cases = [
    [null, "COUPON_INVALID"],
    [couponFixture({ isActive: false }), "COUPON_INVALID"],
    [couponFixture({ startsAt: new Date("2030-01-02") }), "COUPON_NOT_STARTED"],
    [couponFixture({ expiresAt: new Date("2029-12-31") }), "COUPON_EXPIRED"],
  ];
  for (const [coupon, code] of cases) {
    const restore = mockResolution({ coupon });
    try {
      await assert.rejects(
        resolveCouponForDraft({ code: "SAVE10", draft: draftFixture(), userId, now: new Date("2030-01-01") }),
        (error) => error.code === code,
      );
    } finally { restore(); }
  }
});

test("usage, customer and minimum limits are enforced", async () => {
  const cases = [
    [couponFixture({ usageLimit: 1, usageCount: 1 }), "COUPON_USAGE_LIMIT_REACHED"],
    [couponFixture({ usageRecords: [{ user: userId }] }), "COUPON_CUSTOMER_LIMIT_REACHED"],
    [couponFixture({ minimumAmount: 101 }), "COUPON_MINIMUM_AMOUNT_NOT_MET"],
  ];
  for (const [coupon, code] of cases) {
    const restore = mockResolution({ coupon });
    try {
      await assert.rejects(
        resolveCouponForDraft({ code: "SAVE10", draft: draftFixture(), userId }),
        (error) => error.code === code,
      );
    } finally { restore(); }
  }
});

test("service, product and pricing policy eligibility are enforced", async () => {
  const cases = [
    [couponFixture({ applicableTo: { scope: "SELECTED", serviceTypes: ["VISA"], productIds: [] } }), productFixture()],
    [couponFixture({ applicableTo: { scope: "SELECTED", serviceTypes: [], productIds: ["other"] } }), productFixture()],
    [couponFixture(), productFixture({ pricingPolicy: { tax: { enabled: false }, discount: { enabled: false }, couponEligible: false } })],
  ];
  for (const [coupon, product] of cases) {
    const restore = mockResolution({ coupon, product });
    try {
      await assert.rejects(
        resolveCouponForDraft({ code: "SAVE10", draft: draftFixture(), userId }),
        (error) => error.code === "COUPON_NOT_APPLICABLE",
      );
    } finally { restore(); }
  }
});

test("apply and remove persist backend-calculated quotes", async () => {
  const draft = draftFixture();
  const restore = mockResolution();
  try {
    const applied = await applyCouponToDraft({ draft, code: "save10", userId });
    assert.equal(applied.total, 90);
    assert.equal(applied.coupon.code, "SAVE10");
    const removed = await removeCouponFromDraft({ draft });
    assert.equal(removed.total, 100);
    assert.equal(removed.coupon, null);
    assert.equal(draft.saveCalls, 2);
  } finally { restore(); }
});

test("coupon consumption is idempotent for a repeated payment callback", async () => {
  const originalFindOne = Coupon.findOne;
  const originalUpdate = Coupon.findOneAndUpdate;
  const paymentTransactionId = new mongoose.Types.ObjectId();
  let updates = 0;
  Coupon.findOne = async () => ({ _id: couponId });
  Coupon.findOneAndUpdate = async () => { updates += 1; return { _id: couponId }; };
  try {
    const result = await consumeDraftCoupon({
      draft: { pricing: { coupon: { couponId } } },
      userId,
      paymentTransactionId,
      bookingId: new mongoose.Types.ObjectId(),
    });
    assert.equal(String(result._id), String(couponId));
    assert.equal(updates, 0);
  } finally { Coupon.findOne = originalFindOne; Coupon.findOneAndUpdate = originalUpdate; }
});

test("successful consumption uses one atomic guarded update", async () => {
  const originalFindOne = Coupon.findOne;
  const originalUpdate = Coupon.findOneAndUpdate;
  let capturedFilter;
  let capturedUpdate;
  Coupon.findOne = async () => null;
  Coupon.findOneAndUpdate = async (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;
    return { _id: couponId };
  };
  try {
    await consumeDraftCoupon({
      draft: { pricing: { coupon: { couponId } } },
      userId,
      paymentTransactionId: new mongoose.Types.ObjectId(),
      bookingId: new mongoose.Types.ObjectId(),
    });
    assert.ok(capturedFilter.$expr);
    assert.equal(capturedUpdate.$inc.usageCount, 1);
    assert.ok(capturedUpdate.$push.usageRecords.paymentTransaction);
  } finally { Coupon.findOne = originalFindOne; Coupon.findOneAndUpdate = originalUpdate; }
});

test("concurrent duplicate consumption resolves as idempotent success", async () => {
  const originalFindOne = Coupon.findOne;
  const originalUpdate = Coupon.findOneAndUpdate;
  let lookups = 0;
  Coupon.findOne = async () => {
    lookups += 1;
    return lookups === 1 ? null : { _id: couponId };
  };
  Coupon.findOneAndUpdate = async () => null;
  try {
    const consumed = await consumeDraftCoupon({
      draft: { pricing: { coupon: { couponId } } },
      userId,
      paymentTransactionId: new mongoose.Types.ObjectId(),
      bookingId: new mongoose.Types.ObjectId(),
    });
    assert.equal(String(consumed._id), String(couponId));
    assert.equal(lookups, 2);
  } finally { Coupon.findOne = originalFindOne; Coupon.findOneAndUpdate = originalUpdate; }
});
