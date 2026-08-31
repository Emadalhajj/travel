
/*

*/

// services/pricing/priceEngine.js

// services/pricing/priceEngine.js

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const normalizeDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
const getDayName = (date) => DAYS[normalizeDate(date)?.getDay()];

const checkPeriodMatch = (checkDate, dayName, period) => {
  switch (period.periodType) {
    case "weekend":
      return period.days?.includes(dayName);
    case "seasonal":
    case "holiday":
    case "custom": {
      if (!period.startDate || !period.endDate) return false;
      const start = normalizeDate(period.startDate)?.getTime();
      const end = normalizeDate(period.endDate)?.getTime();
      const current = normalizeDate(checkDate)?.getTime();
      return current >= start && current <= end;
    }
    default:
      return false;
  }
};

// ✅ ترتيب الفترات المتداخلة
const typePriority = {
  holiday: 4,
  seasonal: 3,
  weekend: 2,
  custom: 1,
};

const sortPeriods = (a, b) => {
  // 1. أعلى أولوية
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }
  // 2. نوع الفترة الأعلى
  const typeDiff = (typePriority[b.periodType] || 0) - (typePriority[a.periodType] || 0);
  if (typeDiff !== 0) return typeDiff;
  // 3. الأحدث إنشاءً
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
};

/**
 * يُرجع السعر المطبق لتاريخ واحد
 */
export const getPriceForDate = (date, pricing) => {
  const checkDate = normalizeDate(date);
  const dayName = getDayName(checkDate);

  if (!pricing?.pricingPeriods) {
    return {
      type: "base",
      name: { ar: "سعر عادي", en: "Base Price" },
      price: pricing?.basePrice || 0,
      source: "base",
    };
  }

  // ✅ جمع كل الفترات المطبقة ثم ترتيبها كاملاً
  const applicablePeriods = pricing.pricingPeriods
    ?.filter((p) => p.isActive)
    ?.filter((p) => checkPeriodMatch(checkDate, dayName, p))
    ?.sort(sortPeriods); // ← الترتيب الكامل هنا

  if (!applicablePeriods?.length) {
    return {
      type: "base",
      name: { ar: "سعر عادي", en: "Base Price" },
      price: pricing.basePrice,
      source: "base",
    };
  }

  const best = applicablePeriods[0]; // ← أول فترة بعد الترتيب الكامل

  return {
    type: best.periodType,
    name: { ar: best.nameAr, en: best.nameEn },
    price: best.price,
    source: "period",
    periodId: best._id,
  };
};
