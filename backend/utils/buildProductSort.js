const DIRECTIONS = Object.freeze({ asc: 1, desc: -1 });

export const buildProductSort = ({
  value,
  priceField,
  defaultSort = { createdAt: -1 },
} = {}) => {
  const allowedFields = new Set(["createdAt", priceField].filter(Boolean));
  const separator = String(value || "").lastIndexOf("_");

  if (separator < 1) return defaultSort;

  const field = value.slice(0, separator);
  const direction = value.slice(separator + 1);

  if (!allowedFields.has(field) || !DIRECTIONS[direction]) return defaultSort;

  return { [field]: DIRECTIONS[direction] };
};
