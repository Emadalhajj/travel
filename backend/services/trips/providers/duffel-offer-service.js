import { getDuffelConfig } from "../../../config/duffel.js";
import { duffelClient } from "./duffel-client.js";

const repeatPassenger = (type, count) =>
  Array.from({ length: Number(count) || 0 }, () => ({ type }));

export const buildDuffelOfferRequest = (criteria) => {
  const slices = [{
    origin: criteria.origin,
    destination: criteria.destination,
    departure_date: criteria.departureDate,
  }];

  if (criteria.returnDate) {
    slices.push({
      origin: criteria.destination,
      destination: criteria.origin,
      departure_date: criteria.returnDate,
    });
  }

  return {
    data: {
      cabin_class: String(criteria.cabinClass || "ECONOMY").toLowerCase(),
      slices,
      passengers: [
        ...repeatPassenger("adult", criteria.adults),
        ...repeatPassenger("child", criteria.children),
        ...repeatPassenger("infant_without_seat", criteria.infants),
      ],
    },
  };
};

const normalizePlace = (place = {}) => ({
  code: place.iata_code || place.iata_city_code || "",
  name: place.name || "",
  cityName: place.city_name || "",
});

const normalizeCarrier = (carrier = {}) => ({
  name: carrier.name || "",
  iataCode: carrier.iata_code || "",
  logoUrl: carrier.logo_symbol_url || carrier.logo_lockup_url || "",
});

const normalizeSegment = (segment = {}) => ({
  id: segment.id || "",
  origin: normalizePlace(segment.origin),
  destination: normalizePlace(segment.destination),
  departureAt: segment.departing_at || null,
  arrivalAt: segment.arriving_at || null,
  flightNumber: segment.marketing_carrier_flight_number || "",
  aircraft: segment.aircraft?.name || "",
  duration: segment.duration || "",
  marketingCarrier: normalizeCarrier(segment.marketing_carrier),
  operatingCarrier: normalizeCarrier(segment.operating_carrier),
  passengers: segment.passengers || [],
});

export const normalizeDuffelOffer = (offer = {}, offerRequest = {}) => {
  const slices = offer.slices || [];
  const segments = slices.flatMap((slice) => slice.segments || []).map(normalizeSegment);
  const firstSegment = segments[0] || {};
  const lastSegment = segments.at(-1) || {};

  return {
    source: "API",
    provider: "DUFFEL",
    offerId: offer.id || "",
    offerRequestId: offer.offer_request_id || offerRequest.id || "",
    expiresAt: offer.expires_at || null,
    liveMode: Boolean(offer.live_mode ?? offerRequest.live_mode),
    origin: firstSegment.origin || { code: "", name: "", cityName: "" },
    destination: lastSegment.destination || { code: "", name: "", cityName: "" },
    departureAt: firstSegment.departureAt || null,
    arrivalAt: lastSegment.arrivalAt || null,
    airline: firstSegment.marketingCarrier || { name: "", iataCode: "", logoUrl: "" },
    segments,
    slices: slices.map((slice) => ({
      id: slice.id || "",
      origin: normalizePlace(slice.origin),
      destination: normalizePlace(slice.destination),
      duration: slice.duration || "",
      segmentIds: (slice.segments || []).map((segment) => segment.id),
    })),
    cabinClass: String(offer.cabin_class || "").toUpperCase(),
    pricing: {
      total: Number(offer.total_amount || 0),
      currency: offer.total_currency || "",
      tax: Number(offer.tax_amount || 0),
      taxCurrency: offer.tax_currency || offer.total_currency || "",
    },
    passengers: {
      count: (offer.passengers || offerRequest.passengers || []).length,
      items: offer.passengers || offerRequest.passengers || [],
    },
  };
};

export const searchDuffelOffers = async (
  criteria,
  { client = duffelClient, configFactory = getDuffelConfig } = {},
) => {
  const config = configFactory();
  const payload = buildDuffelOfferRequest(criteria);
  const response = await client.request("/air/offer_requests", {
    method: "POST",
    body: payload,
    params: {
      return_offers: true,
      supplier_timeout: config.supplierTimeoutMs,
    },
  });
  const offerRequest = response?.data || {};
  return (offerRequest.offers || []).map((offer) =>
    normalizeDuffelOffer(offer, offerRequest));
};
