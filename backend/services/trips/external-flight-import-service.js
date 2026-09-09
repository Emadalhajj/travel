import mongoose from "mongoose";

import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import { TRIP_SCOPES, TRIP_SOURCES, TRIP_TYPES } from "../../constants/trips/trip.constants.js";
import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import AppError from "../../utils/AppError.js";
import { createTripDepartureService } from "./trip-departure-service.js";
import { createTripService } from "./trip-service.js";
import { getExternalFlightOffer } from "./providers/flight-provider-factory.js";

const PROVIDER = "DUFFEL";

const withSession = async (query, session) => {
  if (session) query.session(session);
  return query;
};

const defaultFindDeparture = (identity, session) => withSession(
  TripDeparture.findOne({ ...identity, isDeleted: false }),
  session,
);

const defaultFindTrip = (identity, session) => withSession(
  Trip.findOne({ ...identity, isDeleted: false }),
  session,
);

const getSliceSegments = (offer, slice) => {
  const segmentIds = new Set(slice.segmentIds || []);
  return (offer.segments || []).filter((segment) => segmentIds.has(segment.id));
};

const buildExternalId = (offer, slice, index) =>
  slice.id || `${offer.offerId}:slice:${index}`;

const getCurrency = (currency) =>
  SUPPORTED_CURRENCIES.includes(currency) ? currency : DEFAULT_CURRENCY;

const buildTripData = ({ offer, slice, segments }) => {
  const first = segments[0];
  const last = segments.at(-1);
  const origin = slice.origin?.code || first?.origin?.code || "";
  const destination = slice.destination?.code || last?.destination?.code || "";
  const carrier = first?.marketingCarrier?.name || first?.operatingCarrier?.name || PROVIDER;
  const sameKnownCountry =
    slice.origin?.countryCode &&
    slice.origin.countryCode === slice.destination?.countryCode;

  return {
    nameAr: `رحلة ${origin} إلى ${destination}`,
    nameEn: `${origin} to ${destination} flight`,
    descriptionAr: `رحلة جوية خارجية عبر ${carrier}`,
    descriptionEn: `External flight operated by ${carrier}`,
    type: TRIP_TYPES.AIR,
    scope: sameKnownCountry ? TRIP_SCOPES.DOMESTIC : TRIP_SCOPES.INTERNATIONAL,
    subtype: "FLIGHT",
    source: TRIP_SOURCES.API,
    airline: carrier,
    flightNumber: segments.length === 1 ? first?.flightNumber || "" : "",
    originAirport: origin,
    destinationAirport: destination,
    cabinClass: offer.cabinClass || "",
    aircraft: segments.length === 1 ? first?.aircraft || "" : "",
    pricing: {
      basePrice: 0,
      discountPrice: 0,
      currency: getCurrency(offer.pricing?.currency),
    },
    features: {},
    images: [],
    isActive: true,
  };
};

const buildTripIdentity = (tripData, segments) => segments.length === 1 ? {
  type: tripData.type,
  subtype: tripData.subtype,
  source: tripData.source,
  originAirport: tripData.originAirport,
  destinationAirport: tripData.destinationAirport,
  airline: tripData.airline,
  flightNumber: tripData.flightNumber,
} : null;

const buildDepartureData = ({ offer, slice, segments, tripId, externalId }) => ({
  tripId,
  departureAt: segments[0]?.departureAt,
  arrivalAt: segments.at(-1)?.arrivalAt,
  source: TRIP_SOURCES.API,
  providerId: PROVIDER,
  externalId,
  serviceNumber: segments.length === 1 ? segments[0]?.flightNumber || "" : "",
  pricing: {
    basePrice: 0,
    discountPrice: 0,
    currency: getCurrency(offer.pricing?.currency),
  },
  capacity: { totalSeats: 0 },
  segments: segments.map((segment, index) => ({
    sequence: index,
    from: segment.origin?.code || "",
    to: segment.destination?.code || "",
    departureAt: segment.departureAt,
    arrivalAt: segment.arrivalAt,
    carrierCode: segment.marketingCarrier?.iataCode || segment.operatingCarrier?.iataCode || "",
    carrierName: segment.operatingCarrier?.name || segment.marketingCarrier?.name || "",
    serviceNumber: segment.flightNumber || "",
    departureTerminal: segment.departureTerminal || "",
    arrivalTerminal: segment.arrivalTerminal || "",
  })),
  providerSnapshot: {
    offerId: offer.offerId,
    offerRequestId: offer.offerRequestId,
    total: offer.pricing?.total || 0,
    currency: offer.pricing?.currency || "",
    expiresAt: offer.expiresAt,
  },
  isActive: true,
});

const assertImportableOffer = (offer, requestedOfferId) => {
  if (
    !offer?.offerId ||
    offer.offerId !== requestedOfferId ||
    !(offer.slices || []).length
  ) {
    throw new AppError("EXTERNAL_FLIGHT_OFFER_INVALID", 422, "offerId");
  }
  const expiresAt = new Date(offer.expiresAt || 0);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    throw new AppError("EXTERNAL_FLIGHT_OFFER_EXPIRED", 409, "offerId");
  }
};

const resolveExisting = async ({ identities, findDeparture }) => {
  const departures = await Promise.all(
    identities.map((identity) => findDeparture(identity, null)),
  );
  return departures.every(Boolean) ? departures : null;
};

export const importExternalFlightOffer = async ({
  provider = PROVIDER,
  offerId,
  userId,
  req,
}, dependencies = {}) => {
  const getOffer = dependencies.getOffer || getExternalFlightOffer;
  const startSession = dependencies.startSession || (() => mongoose.startSession());
  const findDeparture = dependencies.findDeparture || defaultFindDeparture;
  const findTrip = dependencies.findTrip || defaultFindTrip;
  const createTrip = dependencies.createTrip || createTripService;
  const createDeparture = dependencies.createDeparture || createTripDepartureService;
  const providerCode = String(provider).toUpperCase();
  const offer = await getOffer({ provider: providerCode, offerId });
  assertImportableOffer(offer, offerId);

  const slices = offer.slices.map((slice, index) => ({
    slice,
    segments: getSliceSegments(offer, slice),
    externalId: buildExternalId(offer, slice, index),
  }));
  if (slices.some(({ segments }) => !segments.length)) {
    throw new AppError("EXTERNAL_FLIGHT_SEGMENTS_MISSING", 422, "offerId");
  }

  const identities = slices.map(({ externalId }) => ({
    providerId: providerCode,
    externalId,
  }));
  const session = await startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const imported = [];
      for (let index = 0; index < slices.length; index += 1) {
        const { slice, segments, externalId } = slices[index];
        const identity = identities[index];
        const existing = await findDeparture(identity, session);
        if (existing) {
          imported.push({ trip: existing.tripId, departure: existing, reused: true });
          continue;
        }

        const tripData = buildTripData({ offer, slice, segments });
        const tripIdentity = buildTripIdentity(tripData, segments);
        let trip = tripIdentity ? await findTrip(tripIdentity, session) : null;
        if (!trip) {
          trip = await createTrip({ data: tripData, userId, req, session });
        }
        const departure = await createDeparture({
          data: buildDepartureData({ offer, slice, segments, tripId: trip._id, externalId }),
          userId,
          req,
          session,
        });
        imported.push({ trip, departure, reused: false });
      }
      result = imported;
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await resolveExisting({ identities, findDeparture });
      if (existing) {
        result = existing.map((departure) => ({
          trip: departure.tripId,
          departure,
          reused: true,
        }));
      } else {
        throw new AppError("EXTERNAL_FLIGHT_IMPORT_CONFLICT", 409, "offerId");
      }
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  return {
    provider: providerCode,
    offer: {
      offerId: offer.offerId,
      total: offer.pricing?.total || 0,
      currency: offer.pricing?.currency || "",
      expiresAt: offer.expiresAt,
    },
    items: result,
  };
};
