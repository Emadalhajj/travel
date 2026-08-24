export const NUMBER_LOCALE = "en-US";

export const formatNumber = (value, options = {}) => {
  const numericValue = Number(value);
  return new Intl.NumberFormat(NUMBER_LOCALE, options).format(Number.isFinite(numericValue) ? numericValue : 0);
};

export const formatCurrency = (value, currency = "SAR", options = {}) => formatNumber(value, {
  style: "currency",
  currency: currency || "SAR",
  maximumFractionDigits: 2,
  ...options,
});
