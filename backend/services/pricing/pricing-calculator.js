import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import {
  PRICING_CHARGE_TYPE_VALUES,
  PRICING_DISCOUNT_TYPES,
  PRICING_DISCOUNT_TYPE_VALUES,
  PRICING_VERSION,
} from "../../constants/pricing/pricing-constants.js";
import AppError from "../../utils/AppError.js";
import { roundPrice } from "../../utils/roundPrice.js";

const asFiniteNumber = (value, field, { min = 0, greaterThan = null } = {}) => {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < min ||
    (greaterThan !== null && number <= greaterThan)
  ) {
    throw new AppError("PRICING_VALUE_INVALID", 400, field, { field });
  }
  return number;
};

const normalizeCurrency = (value) => {
  const currency = String(value || "").trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new AppError("PRICING_CURRENCY_UNSUPPORTED", 400, "currency", { currency });
  }
  return currency;
};

const normalizeTax = (tax = {}) => {
  const enabled = tax?.enabled === true;
  const rate = asFiniteNumber(tax?.rate ?? 0, "tax.rate");
  if (rate > 100) {
    throw new AppError("PRICING_PERCENTAGE_INVALID", 400, "tax.rate");
  }
  return { enabled, rate, inclusive: enabled && tax?.inclusive === true };
};

const normalizeDiscount = (discount = {}, now = new Date()) => {
  const enabled = discount?.enabled === true;
  const rawType = String(discount?.type || "").trim().toUpperCase();
  const type = enabled ? rawType : null;
  if (enabled && !PRICING_DISCOUNT_TYPE_VALUES.includes(type)) {
    throw new AppError("PRICING_DISCOUNT_TYPE_INVALID", 400, "adminDiscount.type");
  }

  const value = asFiniteNumber(discount?.value ?? 0, "adminDiscount.value");
  if (type === PRICING_DISCOUNT_TYPES.PERCENTAGE && value > 100) {
    throw new AppError("PRICING_PERCENTAGE_INVALID", 400, "adminDiscount.value");
  }

  let expiresAt = null;
  if (discount?.expiresAt) {
    expiresAt = new Date(discount.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new AppError("PRICING_DATE_INVALID", 400, "adminDiscount.expiresAt");
    }
  }

  const active = enabled && (!expiresAt || expiresAt.getTime() > now.getTime());
  return { enabled, type, value, expiresAt, active };
};

export const calculatePricingLine = (input = {}, { now = new Date() } = {}) => {
  const unitPrice = asFiniteNumber(input.unitPrice, "unitPrice");
  const quantity = asFiniteNumber(input.quantity ?? 1, "quantity", { greaterThan: 0 });
  const currency = normalizeCurrency(input.currency);
  const chargeType = String(input.chargeType || "PER_UNIT").trim().toUpperCase();
  if (!PRICING_CHARGE_TYPE_VALUES.includes(chargeType)) {
    throw new AppError("PRICING_CHARGE_TYPE_INVALID", 400, "chargeType");
  }

  const subtotal = roundPrice(unitPrice * quantity);
  const discount = normalizeDiscount(input.adminDiscount, now);
  let discountAmount = 0;
  if (discount.active) {
    discountAmount = discount.type === PRICING_DISCOUNT_TYPES.PERCENTAGE
      ? roundPrice(subtotal * (discount.value / 100))
      : roundPrice(Math.min(discount.value, subtotal));
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const amountAfterDiscount = roundPrice(Math.max(0, subtotal - discountAmount));
  const taxableAmount = amountAfterDiscount;
  const tax = normalizeTax(input.tax);
  const taxAmount = !tax.enabled || tax.rate === 0
    ? 0
    : tax.inclusive
      ? roundPrice(taxableAmount - (taxableAmount / (1 + tax.rate / 100)))
      : roundPrice(taxableAmount * (tax.rate / 100));
  const total = tax.enabled && !tax.inclusive
    ? roundPrice(taxableAmount + taxAmount)
    : taxableAmount;

  return {
    sourceType: String(input.sourceType || "").trim().toUpperCase(),
    sourceId: input.sourceId || null,
    chargeType,
    unitPrice: roundPrice(unitPrice),
    quantity,
    subtotal,
    adminDiscount: {
      enabled: discount.enabled,
      type: discount.type,
      value: roundPrice(discount.value),
      expiresAt: discount.expiresAt,
      amount: discountAmount,
      applied: discount.active && discountAmount > 0,
    },
    amountAfterDiscount,
    taxableAmount,
    tax: { ...tax, amount: taxAmount },
    couponEligible: input.couponEligible === true,
    couponDiscountAmount: 0,
    total,
    currency,
    ...(input.breakdown ? { breakdown: structuredClone(input.breakdown) } : {}),
  };
};

export const calculatePricingQuote = (lineInputs = [], options = {}) => {
  if (!Array.isArray(lineInputs) || lineInputs.length === 0) {
    throw new AppError("PRICING_LINES_REQUIRED", 400, "lines");
  }
  let lines = lineInputs.map((line) => calculatePricingLine(line, options));
  const currencies = new Set(lines.map(({ currency }) => currency));
  if (currencies.size !== 1) {
    throw new AppError("PRICING_CURRENCY_MISMATCH", 400, "lines.currency");
  }

  let coupon = null;
  let couponDiscountAmount = 0;
  if (options.coupon) {
    const eligibleIndexes = lines
      .map((line, index) => (
        line.couponEligible &&
        (!options.coupon.eligibleProductIds?.length ||
          options.coupon.eligibleProductIds.map(String).includes(String(line.sourceId)))
          ? index
          : -1
      ))
      .filter((index) => index >= 0);
    const eligibleAmount = roundPrice(eligibleIndexes.reduce(
      (total, index) => total + lines[index].amountAfterDiscount,
      0,
    ));
    const type = String(options.coupon.discountType || options.coupon.type || "").toUpperCase();
    const value = asFiniteNumber(options.coupon.value ?? 0, "coupon.value");
    if (!PRICING_DISCOUNT_TYPE_VALUES.includes(type)) {
      throw new AppError("PRICING_DISCOUNT_TYPE_INVALID", 400, "coupon.discountType");
    }
    if (type === PRICING_DISCOUNT_TYPES.PERCENTAGE && value > 100) {
      throw new AppError("PRICING_PERCENTAGE_INVALID", 400, "coupon.value");
    }
    couponDiscountAmount = type === PRICING_DISCOUNT_TYPES.PERCENTAGE
      ? roundPrice(eligibleAmount * (value / 100))
      : roundPrice(Math.min(value, eligibleAmount));
    couponDiscountAmount = Math.min(couponDiscountAmount, eligibleAmount);

    let allocated = 0;
    lines = lines.map((line, index) => {
      const eligiblePosition = eligibleIndexes.indexOf(index);
      if (eligiblePosition < 0 || couponDiscountAmount === 0) return line;
      const isLast = eligiblePosition === eligibleIndexes.length - 1;
      const allocation = isLast
        ? roundPrice(couponDiscountAmount - allocated)
        : roundPrice(couponDiscountAmount * (line.amountAfterDiscount / eligibleAmount));
      allocated = roundPrice(allocated + allocation);
      const taxableAmount = roundPrice(Math.max(0, line.amountAfterDiscount - allocation));
      const taxAmount = !line.tax.enabled || line.tax.rate === 0
        ? 0
        : line.tax.inclusive
          ? roundPrice(taxableAmount - (taxableAmount / (1 + line.tax.rate / 100)))
          : roundPrice(taxableAmount * (line.tax.rate / 100));
      return {
        ...line,
        couponDiscountAmount: allocation,
        taxableAmount,
        tax: { ...line.tax, amount: taxAmount },
        total: line.tax.enabled && !line.tax.inclusive
          ? roundPrice(taxableAmount + taxAmount)
          : taxableAmount,
      };
    });
    coupon = {
      couponId: options.coupon._id || options.coupon.couponId || null,
      code: String(options.coupon.code || "").toUpperCase(),
      discountType: type,
      value: roundPrice(value),
    };
  }

  const sum = (field) => roundPrice(lines.reduce((total, line) => total + line[field], 0));
  const currency = lines[0].currency;
  return {
    version: PRICING_VERSION,
    currency,
    lines,
    subtotal: sum("subtotal"),
    adminDiscountAmount: roundPrice(
      lines.reduce((total, line) => total + line.adminDiscount.amount, 0),
    ),
    coupon,
    couponDiscountAmount,
    taxableAmount: sum("taxableAmount"),
    taxAmount: roundPrice(lines.reduce((total, line) => total + line.tax.amount, 0)),
    total: sum("total"),
  };
};
