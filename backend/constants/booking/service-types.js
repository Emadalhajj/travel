export const SERVICE_TYPES = Object.freeze({
  FLIGHT: "FLIGHT",
  TRIP: "TRIP",
  ACCOMMODATION: "ACCOMMODATION",
  HOTEL: "HOTEL",
  TRANSPORT: "TRANSPORT",
  VISA: "VISA",
  ZIYARAT: "ZIYARAT",
  EXTRA_SERVICE: "EXTRA_SERVICE",
});

export const normalizeServiceType = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === SERVICE_TYPES.HOTEL
    ? SERVICE_TYPES.ACCOMMODATION
    : normalized;
};

export const isAccommodationServiceType = (value) =>
  normalizeServiceType(value) === SERVICE_TYPES.ACCOMMODATION;

