/*
 دوال مساعدة (Utils)
لعملية الحسابات الديناميكة التي تحدث في الفورم العام
 */

// utils/formHelpers.js

// تعيين قيمة متداخلة: obj, 'pricing.basePrice', 500


export const setNestedValue = (obj, path, value) => {
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const keys = normalizedPath.split(".");

  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = Number.isInteger(Number(nextKey)) ? [] : {};
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
};

export const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;

  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");

  return normalizedPath
    .split(".")
    .reduce((current, key) => current?.[key], obj);
};

// ─── الحسابات العامة ───
export const computations = {
  totalOccupancy: (formData) => {
    const adults = parseInt(getNestedValue(formData, 'capacity.maxAdults')) || 0;
    const children = parseInt(getNestedValue(formData, 'capacity.maxChildren')) || 0;
    return adults + children;
  },

  finalPrice: (formData) => {
    const base = parseFloat(getNestedValue(formData, 'pricing.basePrice')) || 0;
    const discount = parseFloat(getNestedValue(formData, 'pricing.discountPercent')) || 0;
    return base * (1 - discount / 100);
  },

  priceWithTax: (formData, computed) => {
    const final = computed?.finalPrice || computations.finalPrice(formData);
    return final * 1.15;
  },

  savingsAmount: (formData, computed) => {
    const base = parseFloat(getNestedValue(formData, 'pricing.basePrice')) || 0;
    const final = computed?.finalPrice || computations.finalPrice(formData);
    return base - final;
  },
};

// ─── التنسيقات ───
export const formatters = {
  currency: (value, currency = 'SAR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  },
  percentage: (value) => `${value}%`,
  number: (value) => new Intl.NumberFormat('en-US').format(value),
};
