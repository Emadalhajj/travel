import AppError from "../../../utils/AppError.js";
import { duffelClient } from "./duffel-client.js";

const ORDER_STATUSES = Object.freeze({
  CONFIRMED: "CONFIRMED",
  PENDING: "PENDING",
  FAILED: "FAILED",
});

const sanitizeMetadata = (metadata = {}) => Object.fromEntries(
  Object.entries(metadata)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 20)
    .map(([key, value]) => [String(key).slice(0, 40), String(value).slice(0, 200)]),
);

const mapIdentityDocument = (document) => ({
  type: document.type,
  unique_identifier: document.uniqueIdentifier,
  issuing_country_code: document.issuingCountryCode,
  expires_on: document.expiresOn,
});

export const mapPassengerToDuffel = (passenger) => {
  const mapped = {
    id: passenger.providerPassengerId,
    given_name: passenger.givenName,
    family_name: passenger.familyName,
    born_on: passenger.bornOn,
    title: passenger.title,
    gender: passenger.gender,
    email: passenger.email,
    phone_number: passenger.phoneNumber,
  };
  if (passenger.infantPassengerId) {
    mapped.infant_passenger_id = passenger.infantPassengerId;
  }
  if (passenger.identityDocuments?.length) {
    mapped.identity_documents = passenger.identityDocuments.map(mapIdentityDocument);
  }
  return mapped;
};

export const buildDuffelOrderRequest = ({
  offer,
  passengers,
  payment,
  metadata = {},
}) => {
  if (!offer?.offerId) {
    throw new AppError("EXTERNAL_FLIGHT_OFFER_INVALID", 400, "offer.offerId");
  }
  const type = String(payment?.orderType || "").toLowerCase();
  if (!["instant", "hold"].includes(type)) {
    throw new AppError("EXTERNAL_FLIGHT_ORDER_TYPE_INVALID", 400, "payment.orderType");
  }

  const data = {
    type,
    selected_offers: [offer.offerId],
    passengers: passengers.map(mapPassengerToDuffel),
    metadata: sanitizeMetadata(metadata),
  };

  if (type === "instant") {
    const amount = Number(payment?.amount);
    const offerAmount = Number(offer.pricing?.total);
    const currency = String(payment?.currency || "").toUpperCase();
    const offerCurrency = String(offer.pricing?.currency || "").toUpperCase();
    if (amount !== offerAmount || currency !== offerCurrency) {
      throw new AppError("EXTERNAL_FLIGHT_ORDER_PAYMENT_MISMATCH", 400, "payment");
    }
    if (!payment?.type) {
      throw new AppError("EXTERNAL_FLIGHT_ORDER_PAYMENT_REQUIRED", 400,
        "payment.type");
    }
    data.payments = [{
      type: payment.type,
      amount: amount.toFixed(2),
      currency,
    }];
  }

  return { data };
};

const normalizePassenger = (passenger = {}) => ({
  providerPassengerId: passenger.id || "",
  givenName: passenger.given_name || "",
  familyName: passenger.family_name || "",
});

const normalizeSegment = (segment = {}) => ({
  externalId: segment.id || "",
  origin: segment.origin?.iata_code || segment.origin?.iata_city_code || "",
  destination:
    segment.destination?.iata_code || segment.destination?.iata_city_code || "",
  departureAt: segment.departing_at || null,
  arrivalAt: segment.arriving_at || null,
  operatingCarrier: segment.operating_carrier?.name || "",
});

export const normalizeDuffelOrder = (order = {}, { httpStatus = 200 } = {}) => ({
  provider: "DUFFEL",
  orderId: order.id || "",
  offerId: order.offer_id || "",
  bookingReference: order.booking_reference || "",
  status: httpStatus === 202
    ? ORDER_STATUSES.PENDING
    : order.id
      ? ORDER_STATUSES.CONFIRMED
      : ORDER_STATUSES.FAILED,
  awaitingPayment: Boolean(order.payment_status?.awaiting_payment),
  paymentRequiredBy: order.payment_status?.payment_required_by || null,
  total: {
    amount: Number(order.total_amount || 0),
    currency: order.total_currency || "",
  },
  slices: (order.slices || []).map((slice) => ({
    externalId: slice.id || "",
    segments: (slice.segments || []).map(normalizeSegment),
  })),
  passengers: (order.passengers || []).map(normalizePassenger),
  availableActions: order.available_actions || [],
  createdAt: order.created_at || null,
});

export const createDuffelOrder = async (input, { client = duffelClient } = {}) => {
  const response = await client.request("/air/orders", {
    method: "POST",
    body: buildDuffelOrderRequest(input),
    includeResponseMeta: true,
    useOrderTimeout: true,
  });
  return normalizeDuffelOrder(response?.payload?.data || {}, {
    httpStatus: response?.status,
  });
};

export const getDuffelOrder = async (orderId, { client = duffelClient } = {}) => {
  const response = await client.request(`/air/orders/${encodeURIComponent(orderId)}`);
  return normalizeDuffelOrder(response?.data || {});
};

export const findDuffelOrdersByOffer = async (
  offerId,
  { client = duffelClient } = {},
) => {
  const response = await client.request("/air/orders", {
    params: { offer_id: offerId, limit: 50 },
  });
  return (response?.data || []).map((order) => normalizeDuffelOrder(order));
};
