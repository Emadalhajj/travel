export const PRICING_VERSION = 2;

export const PRICING_CHARGE_TYPES = Object.freeze({
  PER_TRAVELER: "PER_TRAVELER",
  PER_UNIT: "PER_UNIT",
  PER_BOOKING: "PER_BOOKING",
});

export const PRICING_CHARGE_TYPE_VALUES = Object.freeze(
  Object.values(PRICING_CHARGE_TYPES),
);

export const PRICING_DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
});

export const PRICING_DISCOUNT_TYPE_VALUES = Object.freeze(
  Object.values(PRICING_DISCOUNT_TYPES),
);
