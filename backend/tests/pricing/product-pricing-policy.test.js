import assert from "node:assert/strict";
import test from "node:test";

import ExtraService from "../../models/extra-services/extra-service-model.js";
import RoomType from "../../models/hotels/roomType-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import UmrahProgram from "../../models/umrah-programs/umrah-program-model.js";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";
import Visa from "../../models/visa-model.js";
import { productPricingPolicyValidation } from "../../services/validators/pricing/product-pricing-policy-validation.js";
import {
  calculateProductPricingLine,
  resolveProductPricingLineInput,
} from "../../services/pricing/product-pricing-policy.js";

const product = (pricingPolicy) => ({
  _id: "product-1",
  pricing: { basePrice: 1000, currency: "SAR" },
  ...(pricingPolicy === undefined ? {} : { pricingPolicy }),
});

test("new product policy defaults to no tax, no discount and no coupons", () => {
  const result = calculateProductPricingLine({
    domain: "EXTRA_SERVICE",
    product: product({}),
  });
  assert.equal(result.total, 1000);
  assert.equal(result.tax.amount, 0);
  assert.equal(result.adminDiscount.amount, 0);
  assert.equal(result.couponEligible, false);
});

test("product policy accepts administrator-entered 15% and 7.5% tax", () => {
  for (const [rate, expected] of [[15, 1150], [7.5, 1075]]) {
    const result = calculateProductPricingLine({
      domain: "EXTRA_SERVICE",
      product: product({ tax: { enabled: true, rate, inclusive: false } }),
    });
    assert.equal(result.total, expected);
  }
});

test("inclusive product tax is extracted without increasing total", () => {
  const result = calculateProductPricingLine({
    domain: "EXTRA_SERVICE",
    product: product({ tax: { enabled: true, rate: 15, inclusive: true } }),
  });
  assert.equal(result.total, 1000);
  assert.equal(result.tax.amount, 130.43);
});

test("product policy applies percentage and fixed discounts", () => {
  const percentage = calculateProductPricingLine({
    domain: "EXTRA_SERVICE",
    product: product({ discount: { enabled: true, type: "PERCENTAGE", value: 10 } }),
  });
  const fixed = calculateProductPricingLine({
    domain: "EXTRA_SERVICE",
    product: product({ discount: { enabled: true, type: "FIXED", value: 125 } }),
  });
  assert.equal(percentage.total, 900);
  assert.equal(fixed.total, 875);
});

test("expired product discount is not applied", () => {
  const result = calculateProductPricingLine({
    domain: "EXTRA_SERVICE",
    product: product({
      discount: {
        enabled: true,
        type: "PERCENTAGE",
        value: 50,
        expiresAt: "2025-01-01T00:00:00.000Z",
      },
    }),
  }, { now: new Date("2026-01-01T00:00:00.000Z") });
  assert.equal(result.total, 1000);
  assert.equal(result.adminDiscount.applied, false);
});

test("coupon eligibility persists as both true and false", () => {
  for (const couponEligible of [true, false]) {
    const service = new ExtraService({
      nameAr: "خدمة",
      nameEn: "Service",
      pricing: { basePrice: 10, currency: "SAR" },
      pricingPolicy: { couponEligible },
    });
    assert.equal(service.validateSync(), undefined);
    assert.equal(service.toObject().pricingPolicy.couponEligible, couponEligible);
  }
});

test("shared backend validation rejects invalid tax and percentage discount", () => {
  const tax = productPricingPolicyValidation.validate({
    tax: { enabled: true, rate: 101 },
  });
  const discount = productPricingPolicyValidation.validate({
    discount: { enabled: true, type: "PERCENTAGE", value: 101 },
  });
  assert.ok(tax.error);
  assert.ok(discount.error);
});

test("all sellable local product owners expose the shared policy", () => {
  for (const Model of [
    UmrahProgram,
    RoomType,
    TripDeparture,
    Visa,
    ExtraService,
    VehicleRental,
  ]) {
    assert.ok(Model.schema.path("pricingPolicy"), `${Model.modelName} policy missing`);
  }
});

test("legacy local products remain readable without a pricing policy", () => {
  const cases = [
    ["UMRAH_PROGRAM", { pricing: { finalPrice: 900, basePrice: 1000, currency: "SAR" } }, 900],
    ["ROOM_TYPE", { pricing: { basePrice: 1000, discountPercent: 10, currency: "SAR" } }, 1000],
    ["TRIP_DEPARTURE", { pricing: { basePrice: 1000, discountPrice: 850, currency: "SAR" } }, 850],
    ["VISA", { price: 400, currency: "SAR" }, 400],
    ["EXTRA_SERVICE", { pricing: { basePrice: 75, currency: "SAR" } }, 75],
  ];
  for (const [domain, legacyProduct, expected] of cases) {
    assert.equal(resolveProductPricingLineInput({ domain, product: legacyProduct }).unitPrice, expected);
  }
});

test("legacy RoomType discount remains readable exactly once", () => {
  const result = calculateProductPricingLine({
    domain: "ROOM_TYPE",
    product: { pricing: { basePrice: 1000, discountPercent: 10, currency: "SAR" } },
  });
  assert.equal(result.total, 900);
});

test("seasonal RoomType unit price remains authoritative for the selected date", () => {
  const room = {
    pricing: {
      basePrice: 100,
      currency: "SAR",
      pricingPeriods: [{ startDate: "2026-12-01", endDate: "2026-12-31", price: 180 }],
    },
    pricingPolicy: { tax: { enabled: false, rate: 0, inclusive: false } },
  };
  const result = calculateProductPricingLine({
    domain: "ROOM_TYPE",
    product: room,
    unitPrice: 180,
    priceSource: "seasonal",
  });
  assert.equal(result.unitPrice, 180);
  assert.deepEqual(room.pricing.pricingPeriods[0], {
    startDate: "2026-12-01",
    endDate: "2026-12-31",
    price: 180,
  });
});

test("TripDeparture policy uses base price and does not reapply legacy discountPrice", () => {
  const result = calculateProductPricingLine({
    domain: "TRIP_DEPARTURE",
    product: {
      pricing: { basePrice: 1000, discountPrice: 800, currency: "SAR" },
      pricingPolicy: {
        discount: { enabled: true, type: "PERCENTAGE", value: 10 },
      },
    },
  });
  assert.equal(result.subtotal, 1000);
  assert.equal(result.total, 900);
});
