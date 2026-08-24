export const formatDate = (
  value,
  { isArabic = true, fallback = "-", dateStyle } = {},
) => {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  if (dateStyle) {
    return new Intl.DateTimeFormat(isArabic ? "en-US" : "en-GB", {
      dateStyle,
    }).format(date);
  }

  return new Intl.DateTimeFormat(isArabic ? "en-US" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const formatDateForInput = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

export const calculateInclusiveDays = (startValue, endValue) => {
  if (!startValue || !endValue) return null;
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

