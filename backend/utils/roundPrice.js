// utils/roundPrice.js

/**
 * تقريب السعر لعدد محدد من المنازل العشرية
 * @param {number} price - السعر الأصلي
 * @param {number} decimals - عدد المنازل العشرية (افتراضي: 2)
 * @returns {number} - السعر المُقرب
 */
export const roundPrice = (price, decimals = 2) => {
  if (price === null || price === undefined || isNaN(price)) return 0;
  return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * تنسيق السعر كعملة
 * @param {number} price - السعر
 * @param {string} currency - العملة (افتراضي: SAR)
 * @returns {string} - السعر المُنسق
 */
export const formatPrice = (price, currency = 'SAR') => {
  const rounded = roundPrice(price);
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};

/**
 * تقريب جميع قيم كائن الأسعار
 * @param {object} priceObj - كائن الأسعار
 * @returns {object} - الكائن بعد التقريب
 */
export const roundPriceObject = (priceObj, decimals = 2) => {
  const rounded = {};
  for (const [key, value] of Object.entries(priceObj)) {
    if (typeof value === 'number') {
      rounded[key] = roundPrice(value, decimals);
    } else {
      rounded[key] = value;
    }
  }
  return rounded;
};