import { DEFAULT_CURRENCY } from "../../constants/currencies.js";
import { PRICING_VERSION } from "../../constants/pricing/pricing-constants.js";
import { roundPrice } from "../../utils/roundPrice.js";

const firstFinite = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

const firstPositiveOrZero = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
};

export const readPricingSnapshot = (pricing = {}) => {
  if (Number(pricing.version) === PRICING_VERSION && Array.isArray(pricing.lines)) {
    return pricing;
  }

  const subtotal = roundPrice(firstFinite(
    pricing.subtotal,
    pricing.subTotal,
    pricing.totalBeforeTax,
    pricing.basePrice,
  ));
  const adminDiscountAmount = roundPrice(firstFinite(
    pricing.adminDiscountAmount,
    pricing.discountAmount,
    pricing.discount,
  ));
  const taxAmount = roundPrice(firstFinite(pricing.taxAmount, pricing.tax));
  // Legacy schemas may materialize a missing alias with default 0. Prefer the
  // first meaningful historical total so either old `total` or `totalPrice`
  // remains readable after hydration.
  const total = roundPrice(firstPositiveOrZero(
    pricing.total,
    pricing.totalPrice,
    pricing.finalPrice,
  ));

  return {
    version: 1,
    currency: String(pricing.currency || DEFAULT_CURRENCY).toUpperCase(),
    lines: [],
    subtotal,
    adminDiscountAmount,
    coupon: null,
    couponDiscountAmount: 0,
    taxableAmount: roundPrice(Math.max(0, subtotal - adminDiscountAmount)),
    taxAmount,
    total,
    legacy: true,
  };
};
