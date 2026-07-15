/*
الشرح

هذه الخدمة تحسب سعر التأجير.

إذا لم توجد فترة خاصة، يستخدم السعر العام.

إذا وجدت فترة خاصة متداخلة مع تاريخ البرنامج، يستخدم سعر الفترة الأعلى أولوية.
*/

import { normalizeDate } from "../booking/availability.js";

export const calculateVehicleRentalPrice = ({
  rental,
  startDate,
  endDate,
}) => {
  const basePrice = Number(rental?.pricing?.basePrice || 0);
  const currency = rental?.pricing?.currency || "SAR";

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (!start || !end || end <= start) {
    return {
      basePrice,
      totalPrice: basePrice,
      currency,
      appliedPeriod: null,
    };
  }

  const periods = rental?.pricing?.pricingPeriods || [];

  const activePeriods = periods
    .filter((period) => period.isActive)
    .filter((period) => {
      if (!period.startDate || !period.endDate) return false;

      const pStart = normalizeDate(period.startDate);
      const pEnd = normalizeDate(period.endDate);

      return start < pEnd && end > pStart;
    })
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

  const appliedPeriod = activePeriods[0];

  if (!appliedPeriod) {
    return {
      basePrice,
      totalPrice: basePrice,
      currency,
      appliedPeriod: null,
    };
  }

  return {
    basePrice,
    totalPrice: Number(appliedPeriod.price || basePrice),
    currency,
    appliedPeriod,
  };
};