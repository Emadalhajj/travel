const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export const calculateStayNights = (checkIn, checkOut) => {
  const start = toUtcDateOnly(checkIn);
  const end = toUtcDateOnly(checkOut);
  if (start === null || end === null || end <= start) return 0;
  return Math.round((end - start) / MS_PER_DAY);
};

