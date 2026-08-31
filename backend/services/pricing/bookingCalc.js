import { getPriceForDate } from "./priceEngine.js";
import { roundPrice } from "../../utils/roundPrice.js";
// ==================== Defaults ====================

export const DEFAULT_TAX_RATE = 15;
export const DEFAULT_CHILD_DISCOUNT = 0.5;

// ==================== Helpers ====================
const normalizeDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// ==================== Nightly Rate ====================

export const calculateNightlyRate = (date, pricing) => {
  const dayPricing = getPriceForDate(date, pricing);
  let nightPrice = dayPricing.price;
  let discountApplied = 0;

  // ✅ الخصم يُطبق على السعر الأساسي فقط
  if (pricing.discountPercent > 0 && dayPricing.source === "base") {
    discountApplied = roundPrice(nightPrice * (pricing.discountPercent / 100));
    nightPrice -= discountApplied;
  }

  return {
    date: normalizeDate(date)?.toISOString()?.split("T")[0],
    dayName: new Date(date).toLocaleDateString("ar-SA", { weekday: "long" }),
    type: dayPricing.type,
    typeName: dayPricing.name,
    originalPrice: dayPricing.price,
    discountApplied,
    finalPrice: roundPrice(nightPrice), // ← roundPrice من utils
    source: dayPricing.source,
  };
};
// ==================== Booking Price ====================

export const calculateBookingPrice = ({
  roomType,
  checkIn,
  checkOut,
  adults = 1,
  children = 0,
  taxRate = DEFAULT_TAX_RATE,
}) => {
  const start = normalizeDate(checkIn);
  const end = normalizeDate(checkOut);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new Error("تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول");
  }

  // ✅ التحقق من السعة
  const totalGuests = adults + children;
  const maxAdults = roomType?.capacity?.maxAdults || 0;
  const maxChildren = roomType?.capacity?.maxChildren || 0;
  const maxCapacity = maxAdults + maxChildren;

  if (totalGuests > maxCapacity) {
    throw new Error(`السعة القصوى ${maxCapacity} أشخاص، الطلب ${totalGuests}`);
  }
  if (adults > maxAdults) {
    throw new Error(`البالغين ${adults} يتجاوزون الحد الأقصى ${maxAdults}`);
  }
  if (children > maxChildren) {
    throw new Error(`الأطفال ${children} يتجاوزون الحد الأقصى ${maxChildren}`);
  }

  const pricing = roomType.pricing;
  const nightlyBreakdown = [];
  let subtotal = 0;

  for (let i = 0; i < nights; i++) {
    const current = new Date(start);
    current.setDate(current.getDate() + i);
    const night = calculateNightlyRate(current, pricing);
    nightlyBreakdown.push(night);
    subtotal += night.finalPrice;
  }

  const adultTotal = roundPrice(subtotal * adults);           // ← roundPrice
  const childTotal = roundPrice(subtotal * DEFAULT_CHILD_DISCOUNT * children); // ← roundPrice
  const beforeTax = roundPrice(adultTotal + childTotal);      // ← roundPrice
  const taxAmount = roundPrice(beforeTax * (taxRate / 100));  // ← roundPrice

  return {
    nights,
    checkIn,
    checkOut,
    nightlyBreakdown,
    summary: {
      baseTotal: roundPrice(subtotal),                         // ← roundPrice
      adultTotal,
      childTotal,
      discountTotal: nightlyBreakdown.reduce((s, n) => s + n.discountApplied, 0),
      subtotal: beforeTax,
      taxRate,
      taxAmount,
      totalPrice: roundPrice(beforeTax + taxAmount),           // ← roundPrice
    },
    currency: pricing?.currency || "SAR",
  };
};
// End of booking price calculation helpers.
