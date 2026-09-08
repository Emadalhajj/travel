export const TRIP_TYPES = Object.freeze({ AIR: "AIR", LAND: "LAND", SEA: "SEA" });
export const TRIP_SCOPES = Object.freeze({ DOMESTIC: "DOMESTIC", INTERNATIONAL: "INTERNATIONAL" });
export const TRIP_SOURCES = Object.freeze({ MANUAL: "MANUAL", API: "API" });

export const TRIP_SUBTYPES_BY_TYPE = Object.freeze({
  AIR: ["FLIGHT"],
  LAND: ["TOUR", "ACTIVITY", "TRANSFER", "TRANSPORT"],
  SEA: ["FERRY", "CRUISE", "TOUR", "TRANSFER"],
});

const labels = {
  AIR: ["جوي", "Air"], LAND: ["بري", "Land"], SEA: ["بحري", "Sea"],
  DOMESTIC: ["داخلي", "Domestic"], INTERNATIONAL: ["دولي", "International"],
  MANUAL: ["يدوي", "Manual"], API: ["مزود خارجي", "API"],
  FLIGHT: ["طيران", "Flight"], TOUR: ["جولة", "Tour"],
  ACTIVITY: ["نشاط", "Activity"], TRANSFER: ["توصيل", "Transfer"],
  TRANSPORT: ["نقل", "Transport"], FERRY: ["عبّارة", "Ferry"],
  CRUISE: ["رحلة بحرية", "Cruise"],
};

export const tripOption = (value) => ({
  value,
  labelAr: labels[value]?.[0] || value,
  labelEn: labels[value]?.[1] || value,
});

export const TRIP_TYPE_OPTIONS = Object.values(TRIP_TYPES).map(tripOption);
export const TRIP_SCOPE_OPTIONS = Object.values(TRIP_SCOPES).map(tripOption);
export const TRIP_SOURCE_OPTIONS = Object.values(TRIP_SOURCES).map(tripOption);
export const getTripSubtypeOptions = (type) =>
  (TRIP_SUBTYPES_BY_TYPE[type] || []).map(tripOption);

export const getTripLabel = (value, lang = "ar") => {
  const label = labels[value];
  return label ? label[lang === "ar" ? 0 : 1] : value || "-";
};

export const formatTripRoute = (trip = {}) => {
  if (!trip || typeof trip !== "object") return "-";

  if (trip.type === TRIP_TYPES.AIR) {
    return [trip.originAirport, trip.destinationAirport].filter(Boolean).join(" → ") || "-";
  }
  const stops = trip.type === TRIP_TYPES.SEA ? trip.ports : trip.routeStops;
  const route = (stops || []).map((item) => item?.location || item?.name || item).filter(Boolean);
  return route.join(" → ") || [trip.fromCity, trip.toCity].filter(Boolean).join(" → ") || "-";
};

const getRoutePointName = (point) =>
  typeof point === "string" ? point : point?.location || point?.name || "";

export const buildTripSegments = (trip = {}) => {
  if (!trip || typeof trip !== "object") return [];

  let points = [];
  if (trip.type === TRIP_TYPES.AIR) {
    points = [trip.originAirport, trip.destinationAirport];
  } else if (trip.type === TRIP_TYPES.SEA) {
    points = trip.ports || [];
  } else {
    points = trip.routeStops || [];
  }

  points = points.map(getRoutePointName).filter(Boolean);
  if (points.length < 2) {
    points = [trip.fromCity, trip.toCity].filter(Boolean);
  }

  const transportId = trip.transportId?._id || trip.transportId || "";
  return points.slice(0, -1).map((from, index) => ({
    from,
    to: points[index + 1],
    departureAt: "",
    arrivalAt: "",
    transportId: trip.type === TRIP_TYPES.LAND ? transportId : "",
    carrierName: "",
    serviceNumber: "",
  }));
};
