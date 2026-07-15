// utils/roundPrice.js
export const roundPrice = (price, decimals = 2) => {
  if (price === null || price === undefined || isNaN(price)) return 0;
  return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// أو باستخدام toFixed (يُرجع string)
export const formatPrice = (price, currency = 'SAR') => {
  const rounded = roundPrice(price);
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};