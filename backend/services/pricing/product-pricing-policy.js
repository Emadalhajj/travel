import { DEFAULT_CURRENCY } from "../../constants/currencies.js";
import { calculatePricingLine } from "./pricing-calculator.js";

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const positiveOrZero = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
};

const policyFromProduct = (product = {}, legacyDiscount = null) => {
  if (hasOwn(product, "pricingPolicy")) return product.pricingPolicy || {};
  return {
    tax: { enabled: false, rate: 0, inclusive: false },
    discount: legacyDiscount || { enabled: false, type: "PERCENTAGE", value: 0 },
    couponEligible: false,
  };
};

const hasProductPolicy = (product) => hasOwn(product, "pricingPolicy");

export const resolveProductPricingLineInput = ({
  domain,
  product = {},
  unitPrice,
  quantity = 1,
  chargeType = "PER_UNIT",
  priceSource = "base",
}) => {
  const type = String(domain || "").trim().toUpperCase();
  let resolvedPrice;
  let currency;
  let legacyDiscount = null;

  switch (type) {
    case "UMRAH_PROGRAM":
      resolvedPrice = hasProductPolicy(product)
        ? positiveOrZero(unitPrice, product.pricing?.basePrice, product.pricing?.totalPrice)
        : positiveOrZero(
          unitPrice,
          product.pricing?.finalPrice,
          product.pricing?.totalPrice,
          product.pricing?.basePrice,
        );
      currency = product.pricing?.currency;
      break;
    case "ROOM_TYPE":
      resolvedPrice = positiveOrZero(unitPrice, product.pricing?.basePrice);
      currency = product.pricing?.currency;
      if (priceSource === "base" && Number(product.pricing?.discountPercent) > 0) {
        legacyDiscount = {
          enabled: true,
          type: "PERCENTAGE",
          value: Number(product.pricing.discountPercent),
        };
      }
      break;
    case "TRIP_DEPARTURE":
      resolvedPrice = hasProductPolicy(product)
        ? positiveOrZero(unitPrice, product.pricing?.basePrice)
        : positiveOrZero(
          unitPrice,
          Number(product.pricing?.discountPrice) > 0
            ? product.pricing.discountPrice
            : product.pricing?.basePrice,
        );
      currency = product.pricing?.currency;
      break;
    case "VISA":
      resolvedPrice = positiveOrZero(unitPrice, product.price);
      currency = product.currency;
      break;
    case "EXTRA_SERVICE":
    case "VEHICLE_RENTAL":
      resolvedPrice = positiveOrZero(unitPrice, product.pricing?.basePrice);
      currency = product.pricing?.currency;
      break;
    default:
      throw new Error(`Unsupported pricing product domain: ${type}`);
  }

  const policy = policyFromProduct(product, legacyDiscount);
  return {
    sourceType: type,
    sourceId: product._id || product.id || null,
    chargeType,
    unitPrice: resolvedPrice,
    quantity,
    currency: String(currency || DEFAULT_CURRENCY).toUpperCase(),
    tax: policy.tax,
    adminDiscount: policy.discount,
    couponEligible: policy.couponEligible === true,
  };
};

export const calculateProductPricingLine = (options, calculatorOptions) => {
  const input = resolveProductPricingLineInput(options);
  const line = calculatePricingLine(input, calculatorOptions);
  return { ...line, couponEligible: input.couponEligible };
};
