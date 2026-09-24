import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import { DRAFT_BOOKING_STATUS } from "../../constants/draft-bookings/draft-booking-status.js";
import { searchExternalFlightOffers } from "./providers/flight-provider-factory.js";
import {
  buildExternalFlightSnapshot,
  revalidateExternalFlightOffer,
} from "./external-flight-revalidation-service.js";
import { calculatePricingQuote } from "../pricing/pricing-calculator.js";

const getPublicProvider = () =>
  String(process.env.PUBLIC_FLIGHT_PROVIDER || "DUFFEL").trim().toUpperCase();

const buildTravelers = (snapshot) =>
  (snapshot.passengers?.items || []).map((passenger) => ({
    fullName: "",
    givenName: "",
    familyName: "",
    email: "",
    phoneNumber: "",
    passengerCategory: passenger.category || "adult",
  }));

export const searchPublicExternalFlights = async (criteria, dependencies = {}) =>
  searchExternalFlightOffers(
    { ...criteria, provider: getPublicProvider() },
    dependencies,
  );

export const createPublicExternalFlightDraft = async ({
  offerId,
  expected,
  userId,
}, dependencies = {}) => {
  const provider = getPublicProvider();
  const result = await revalidateExternalFlightOffer(
    { provider, offerId, expected },
    dependencies,
  );
  const snapshot = buildExternalFlightSnapshot({ provider, offer: result.offer });
  const firstSegment = snapshot.slices?.[0]?.segments?.[0];
  const lastSlice = snapshot.slices?.at(-1);
  const lastSegment = lastSlice?.segments?.at(-1);
  const providerExpiry = snapshot.expiresAt ? new Date(snapshot.expiresAt) : null;
  const defaultExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiresAt = providerExpiry && providerExpiry < defaultExpiry
    ? providerExpiry
    : defaultExpiry;

  const createDraft = dependencies.createDraft || ((data) => DraftBooking.create(data));
  return createDraft({
    user: userId,
    bookingContext: "SERVICE",
    serviceType: "FLIGHT",
    travelers: buildTravelers(snapshot),
    trip: {
      source: "API",
      tripType: "AIR",
      fromCity: snapshot.route.origin,
      toCity: snapshot.route.destination,
      departureAt: firstSegment?.departureAt || null,
      arrivalAt: lastSegment?.arrivalAt || null,
      quantity: 1,
      chargeType: "PER_BOOKING",
      unitPrice: snapshot.pricing.total,
      currency: snapshot.pricing.currency,
      external: snapshot,
    },
    pricing: calculatePricingQuote([{
      sourceType: "EXTERNAL_FLIGHT",
      sourceId: snapshot.offerId,
      chargeType: "PER_BOOKING",
      unitPrice: snapshot.pricing.total,
      quantity: 1,
      currency: snapshot.pricing.currency,
      tax: { enabled: false, rate: 0, inclusive: false },
      adminDiscount: { enabled: false, type: "PERCENTAGE", value: 0 },
      couponEligible: false,
    }]),
    data: {
      bookingContext: "SERVICE",
      serviceType: "FLIGHT",
      travelersCount: snapshot.passengers.total,
    },
    currentStep: "customer_info",
    status: DRAFT_BOOKING_STATUS.DRAFT,
    expiresAt,
  });
};
