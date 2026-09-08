export const TRAVEL_CATEGORIES = new Set(["flights", "trips"]);

export const getProductSelectionId = (product = {}) =>
  product.departureId ||
  product._id ||
  product.id ||
  product.refId ||
  product.itemId ||
  product.productId ||
  null;

export const isTravelCategory = (category) => TRAVEL_CATEGORIES.has(category);

export const getTravelAvailableSeats = (product = {}) => {
  const value = product.inventory?.available ?? product.availableCount;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};

export const formatTravelRoute = (product = {}) => {
  if (product.tripType === "AIR") {
    const airRoute = [product.originAirport, product.destinationAirport]
      .filter(Boolean);
    const cityRoute = [product.fromCity, product.toCity].filter(Boolean);
    return (airRoute.length ? airRoute : cityRoute).join(" → ") || "-";
  }
  const points = product.tripType === "SEA" ? product.ports : product.routeStops;
  const route = (points || []).map((point) => point?.location || point?.name || point).filter(Boolean);
  return route.join(" → ") || [product.fromCity, product.toCity].filter(Boolean).join(" → ") || "-";
};

export const compactTravelProduct = (product = {}) => {
  const raw = product.raw || product;
  const departureId = raw.departureId || product.departureId || raw._id || product._id;
  return {
    category: product.category,
    categoryLabel: product.categoryLabel,
    productId: departureId,
    refId: departureId,
    tripId: raw.tripId || product.tripId || null,
    departureId,
    type: raw.type || product.type,
    tripType: raw.tripType || product.tripType,
    scope: raw.scope || product.scope,
    subtype: raw.subtype || product.subtype,
    source: raw.source || product.source,
    name: product.name,
    nameAr: raw.nameAr || product.nameAr || "",
    nameEn: raw.nameEn || product.nameEn || "",
    fromCity: raw.fromCity || product.fromCity || "",
    toCity: raw.toCity || product.toCity || "",
    originAirport: raw.originAirport || product.originAirport || "",
    destinationAirport: raw.destinationAirport || product.destinationAirport || "",
    routeStops: raw.routeStops || product.routeStops || [],
    ports: raw.ports || product.ports || [],
    departureAt: raw.departureAt || product.departureAt || null,
    arrivalAt: raw.arrivalAt || product.arrivalAt || null,
    airline: raw.airline || product.airline || "",
    flightNumber: raw.flightNumber || product.flightNumber || "",
    cabinClass: raw.cabinClass || product.cabinClass || "",
    baggage: raw.baggage || product.baggage || "",
    vesselName: raw.vesselName || product.vesselName || "",
    priceAtTime: Number(product.priceAtTime ?? raw.pricing?.finalPrice ?? raw.price ?? 0),
    currency: product.currency || raw.pricing?.currency || raw.currency || "SAR",
    quantity: 1,
    chargeType: raw.chargeType || product.chargeType || "PER_TRAVELER",
    inventory: raw.inventory || product.inventory || null,
  };
};
