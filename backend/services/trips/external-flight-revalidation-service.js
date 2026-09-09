import AppError from "../../utils/AppError.js";
import { getExternalFlightOffer } from "./providers/flight-provider-factory.js";

const normalizeCode = (value) => String(value || "").trim().toUpperCase();
const normalizeAmount = (value) => Number(value || 0);
const normalizeCount = (value) => Math.max(0, Number(value || 0));

const isExpired = (value, now = new Date()) => {
  const expiresAt = new Date(value || 0);
  return Number.isNaN(expiresAt.getTime()) || expiresAt <= now;
};

const getRoute = (offer = {}) => ({
  origin: normalizeCode(offer.origin?.code),
  destination: normalizeCode(offer.destination?.code),
});

const buildComparison = ({ offer, expected = {} }) => {
  const expectedPricing = expected.pricing || {};
  const expectedRoute = expected.route || {};
  const expectedPassengers = expected.passengers || {};
  const route = getRoute(offer);
  const expectedTotal = normalizeAmount(expectedPricing.total);
  const currentTotal = normalizeAmount(offer.pricing?.total);
  const expectedCurrency = normalizeCode(expectedPricing.currency);
  const currentCurrency = normalizeCode(offer.pricing?.currency);
  const expectedPassengerCount = normalizeCount(
    expectedPassengers.total ?? expectedPassengers.count,
  );
  const currentPassengerCount = normalizeCount(offer.passengers?.count);

  return {
    priceChanged: expectedTotal > 0 && currentTotal !== expectedTotal,
    currencyChanged:
      Boolean(expectedCurrency) && currentCurrency !== expectedCurrency,
    routeChanged:
      (Boolean(expectedRoute.origin) &&
        normalizeCode(expectedRoute.origin) !== route.origin) ||
      (Boolean(expectedRoute.destination) &&
        normalizeCode(expectedRoute.destination) !== route.destination),
    passengerCountChanged:
      expectedPassengerCount > 0 &&
      currentPassengerCount !== expectedPassengerCount,
  };
};

export const buildExternalFlightSnapshot = ({ provider, offer }) => ({
  provider: normalizeCode(provider),
  offerId: offer.offerId || "",
  offerRequestId: offer.offerRequestId || "",
  expiresAt: offer.expiresAt || null,
  route: getRoute(offer),
  slices: (offer.slices || []).map((slice) => ({
    externalId: slice.id || "",
    origin: normalizeCode(slice.origin?.code),
    destination: normalizeCode(slice.destination?.code),
    segmentIds: Array.isArray(slice.segmentIds) ? slice.segmentIds : [],
    segments: (offer.segments || [])
      .filter((segment) => (slice.segmentIds || []).includes(segment.id))
      .map((segment) => ({
        externalId: segment.id || "",
        origin: normalizeCode(segment.origin?.code),
        destination: normalizeCode(segment.destination?.code),
        departureAt: segment.departureAt || null,
        arrivalAt: segment.arrivalAt || null,
        carrierCode:
          segment.marketingCarrier?.iataCode ||
          segment.operatingCarrier?.iataCode ||
          "",
        carrierName:
          segment.operatingCarrier?.name ||
          segment.marketingCarrier?.name ||
          "",
        serviceNumber: segment.flightNumber || "",
      })),
  })),
  passengers: {
    adults: (offer.passengers?.items || []).filter(({ category }) => category === "adult").length,
    children: (offer.passengers?.items || []).filter(({ category }) => category === "child").length,
    infants: (offer.passengers?.items || []).filter(({ category }) =>
      String(category || "").startsWith("infant")).length,
    total: normalizeCount(offer.passengers?.count),
    items: (offer.passengers?.items || []).map((passenger) => ({
      providerPassengerId: passenger.providerPassengerId || "",
      category: passenger.category || "",
    })),
  },
  pricing: {
    total: normalizeAmount(offer.pricing?.total),
    currency: normalizeCode(offer.pricing?.currency),
  },
  supportedIdentityDocumentTypes:
    Array.isArray(offer.supportedIdentityDocumentTypes)
      ? offer.supportedIdentityDocumentTypes
      : [],
  paymentRequirements: {
    requiresInstantPayment: Boolean(
      offer.paymentRequirements?.requiresInstantPayment,
    ),
    paymentRequiredBy: offer.paymentRequirements?.paymentRequiredBy || null,
  },
  validatedAt: new Date(),
});

export const revalidateExternalFlightOffer = async ({
  provider,
  offerId,
  expected = {},
}, dependencies = {}) => {
  const getOffer = dependencies.getOffer || getExternalFlightOffer;
  let offer;

  try {
    offer = await getOffer({ provider, offerId });
  } catch (error) {
    if (error?.code === "FLIGHT_PROVIDER_TIMEOUT") throw error;
    if (error?.code === "EXTERNAL_FLIGHT_OFFER_EXPIRED") throw error;
    throw new AppError("EXTERNAL_FLIGHT_UNAVAILABLE", 409, "trip.external.offerId", {
      provider: normalizeCode(provider),
      offerId,
    });
  }

  if (!offer?.offerId || offer.offerId !== offerId || !(offer.slices || []).length) {
    throw new AppError("EXTERNAL_FLIGHT_UNAVAILABLE", 409, "trip.external.offerId", {
      provider: normalizeCode(provider),
      offerId,
    });
  }
  if (isExpired(offer.expiresAt, dependencies.now?.() || new Date())) {
    throw new AppError("EXTERNAL_FLIGHT_OFFER_EXPIRED", 409, "trip.external.offerId");
  }

  const comparison = buildComparison({ offer, expected });
  const changed = Object.values(comparison).some(Boolean);
  if (comparison.priceChanged || comparison.currencyChanged) {
    throw new AppError("EXTERNAL_FLIGHT_PRICE_CHANGED", 409, "trip.external.pricing", {
      previous: expected.pricing || null,
      current: offer.pricing || null,
      comparison,
    });
  }
  if (comparison.routeChanged || comparison.passengerCountChanged) {
    throw new AppError("EXTERNAL_FLIGHT_UNAVAILABLE", 409, "trip.external", {
      comparison,
    });
  }

  return { valid: true, changed, offer, comparison };
};

export const revalidateDraftExternalFlight = async ({ trip }, dependencies = {}) => {
  const external = trip?.external;
  if (!external?.provider || !external?.offerId) return null;

  const result = await revalidateExternalFlightOffer({
    provider: external.provider,
    offerId: external.offerId,
    expected: {
      pricing: external.pricing,
      route: external.route,
      passengers: external.passengers,
    },
  }, dependencies);

  return buildExternalFlightSnapshot({
    provider: external.provider,
    offer: result.offer,
  });
};
