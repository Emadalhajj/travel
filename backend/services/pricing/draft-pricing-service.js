import mongoose from "mongoose";

import ExtraService from "../../models/extra-services/extra-service-model.js";
import RoomType from "../../models/hotels/roomType-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import UmrahProgram from "../../models/umrah-programs/umrah-program-model.js";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";
import Visa from "../../models/visa-model.js";
import AppError from "../../utils/AppError.js";
import { getPriceForDate } from "./priceEngine.js";
import { calculatePricingQuote } from "./pricing-calculator.js";
import { resolveProductPricingLineInput } from "./product-pricing-policy.js";
import { getDatesBetween } from "../availability/inventory-availability-service.js";
import { isAccommodationServiceType } from "../../constants/booking/service-types.js";
import { roundPrice } from "../../utils/roundPrice.js";

const CATEGORY_DOMAIN = Object.freeze({
  room: "ROOM_TYPE",
  rooms: "ROOM_TYPE",
  roomtype: "ROOM_TYPE",
  roomtypes: "ROOM_TYPE",
  hotel: "ROOM_TYPE",
  hotels: "ROOM_TYPE",
  visa: "VISA",
  visas: "VISA",
  trip: "TRIP_DEPARTURE",
  trips: "TRIP_DEPARTURE",
  ticket: "TRIP_DEPARTURE",
  flight: "TRIP_DEPARTURE",
  flights: "TRIP_DEPARTURE",
  extras: "EXTRA_SERVICE",
  extraservice: "EXTRA_SERVICE",
  extraservices: "EXTRA_SERVICE",
  vehicle: "VEHICLE_RENTAL",
  vehicles: "VEHICLE_RENTAL",
  vehiclerental: "VEHICLE_RENTAL",
  vehiclerentals: "VEHICLE_RENTAL",
  transport: "TRANSPORT_RESOURCE",
  transports: "TRANSPORT_RESOURCE",
  transfer: "TRANSPORT_RESOURCE",
});

const MODEL_BY_DOMAIN = Object.freeze({
  ROOM_TYPE: RoomType,
  TRIP_DEPARTURE: TripDeparture,
  VISA: Visa,
  EXTRA_SERVICE: ExtraService,
  VEHICLE_RENTAL: VehicleRental,
});

const normalizeKey = (value) => String(value || "").replace(/[^a-z]/gi, "").toLowerCase();
const toLocalDateKey = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const productIdOf = (item = {}) =>
  item.departureId || item.roomTypeId || item.visaId || item.vehicleRentalId ||
  item.refId || item.productId || item._id || item.id || null;
const selectedProductsOf = (draft = {}) => {
  const products = draft.data?.selectedProducts || draft.data?.selectedProductsList || [];
  return Array.isArray(products) ? products : [];
};
const travelerCountOf = (draft = {}) => Math.max(
  1,
  draft.travelers?.length || draft.data?.searchCriteria?.travelersCount || 1,
);

const resolveDomain = (item = {}) => {
  const key = normalizeKey(item.category || item.type || item.productType || item.serviceType);
  return CATEGORY_DOMAIN[key] || null;
};

const ensureObjectId = (value, field) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError("INVALID_LOOKUP_ID", 400, field);
  }
};

const activeFilterFor = (domain, id) => {
  const filter = { _id: id, isActive: { $ne: false } };
  if (domain !== "VISA") filter.isDeleted = { $ne: true };
  if (domain === "TRIP_DEPARTURE") filter.status = "SCHEDULED";
  return filter;
};

const resolveQuantity = ({ domain, item, travelersCount }) => {
  const explicit = String(item.chargeType || item.pricingMode || "").toUpperCase();
  const chargeType = ["PER_TRAVELER", "PER_UNIT", "PER_BOOKING"].includes(explicit)
    ? explicit
    : ["VISA", "TRIP_DEPARTURE", "EXTRA_SERVICE"].includes(domain)
      ? "PER_TRAVELER"
      : "PER_UNIT";
  if (chargeType === "PER_TRAVELER") return { chargeType, quantity: travelersCount };
  if (chargeType === "PER_BOOKING") return { chargeType, quantity: 1 };
  const quantity = Number(item.quantity ?? item.roomsCount ?? item.unitsCount ?? 1);
  return {
    chargeType,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
  };
};

const seasonalUnitPrice = ({ domain, product, draft }) => {
  if (!["ROOM_TYPE", "VEHICLE_RENTAL"].includes(domain)) return undefined;
  const date = draft.program?.startDate || draft.data?.searchCriteria?.startDate;
  if (!date) return undefined;
  return getPriceForDate(date, product.pricing).price;
};

const buildLocalProductInput = async ({ item, draft, travelersCount }) => {
  const domain = resolveDomain(item);
  if (!domain) {
    throw new AppError("PRICING_PRODUCT_TYPE_UNSUPPORTED", 400, "selectedProducts.type");
  }
  // A Transport document describes the resource/provider and has no
  // authoritative selling price of its own. Priced vehicle rental selections
  // are handled by VEHICLE_RENTAL; never infer a transport price from client
  // snapshots or a generic fallback chain.
  if (domain === "TRANSPORT_RESOURCE") return null;
  const productId = productIdOf(item);
  ensureObjectId(productId, "selectedProducts.productId");
  const Model = MODEL_BY_DOMAIN[domain];
  const product = await Model.findOne(activeFilterFor(domain, productId)).lean();
  if (!product) {
    throw new AppError("PRICING_PRODUCT_UNAVAILABLE", 409, "selectedProducts.productId");
  }
  const { chargeType, quantity } = resolveQuantity({ domain, item, travelersCount });
  const resolvedSeasonalPrice = seasonalUnitPrice({ domain, product, draft });
  return resolveProductPricingLineInput({
    domain,
    product,
    unitPrice: resolvedSeasonalPrice,
    priceSource: resolvedSeasonalPrice !== undefined ? "seasonal" : "base",
    chargeType,
    quantity,
  });
};

const buildProgramInput = async ({ draft, travelersCount }) => {
  const selected = draft.data?.selectedPackage || {};
  const programId = selected._id || selected.id || selected.refId || selected.programId || draft.program?.programId;
  if (!programId) return null;
  ensureObjectId(programId, "program.programId");
  const program = await UmrahProgram.findOne({
    _id: programId,
    isActive: true,
    isDeleted: false,
    status: "active",
  }).lean();
  if (!program) throw new AppError("PRICING_PRODUCT_UNAVAILABLE", 409, "program.programId");
  return resolveProductPricingLineInput({
    domain: "UMRAH_PROGRAM",
    product: program,
    chargeType: "PER_TRAVELER",
    quantity: travelersCount,
  });
};

const buildExternalFlightInput = (draft) => {
  const external = draft.trip?.external;
  const amount = Number(external?.pricing?.total || 0);
  if (!external?.provider || !external?.offerId || !Number.isFinite(amount) || amount <= 0) return null;
  return {
    sourceType: "EXTERNAL_FLIGHT",
    sourceId: external.offerId,
    chargeType: "PER_BOOKING",
    unitPrice: amount,
    quantity: 1,
    currency: external.pricing.currency,
    tax: { enabled: false, rate: 0, inclusive: false },
    adminDiscount: { enabled: false, type: "PERCENTAGE", value: 0 },
    couponEligible: false,
  };
};

export const buildAccommodationPricingInput = async (
  draft,
  { RoomTypeModel = RoomType } = {},
) => {
  if (
    String(draft?.bookingContext || "").toUpperCase() !== "SERVICE" ||
    !isAccommodationServiceType(draft?.serviceType)
  ) {
    return null;
  }

  const roomTypeId = draft?.hotel?.roomTypeId;
  ensureObjectId(roomTypeId, "hotel.roomTypeId");
  const roomType = await RoomTypeModel.findOne(
    activeFilterFor("ROOM_TYPE", roomTypeId),
  ).lean();
  if (!roomType) {
    throw new AppError("PRICING_PRODUCT_UNAVAILABLE", 409, "hotel.roomTypeId");
  }

  const nights = getDatesBetween(draft.hotel?.checkIn, draft.hotel?.checkOut);
  if (!nights.length) {
    throw new AppError("ACCOMMODATION_INVALID_DATES", 400, "hotel.checkOut");
  }
  const roomsCount = Number(draft.hotel?.roomsCount || 0);
  if (!Number.isInteger(roomsCount) || roomsCount < 1) {
    throw new AppError("INVALID_POSITIVE_INTEGER", 400, "hotel.roomsCount", {
      field: "roomsCount",
    });
  }

  const nightlyRates = nights.map((date) => {
    const resolved = getPriceForDate(date, roomType.pricing);
    const rate = Number(resolved.price || 0);
    if (!Number.isFinite(rate) || rate < 0) {
      throw new AppError("PRICING_VALUE_INVALID", 400, "pricing.nightlyRate");
    }
    return {
      date: toLocalDateKey(date),
      rate: roundPrice(rate),
      roomsCount,
      subtotal: roundPrice(rate * roomsCount),
      source: resolved.source,
      periodId: resolved.periodId ? String(resolved.periodId) : null,
      periodType: resolved.type || "base",
    };
  });
  const ratePerRoomForStay = roundPrice(nightlyRates.reduce(
    (total, night) => total + night.rate,
    0,
  ));
  const input = resolveProductPricingLineInput({
    domain: "ROOM_TYPE",
    product: roomType,
    unitPrice: ratePerRoomForStay,
    quantity: roomsCount,
    chargeType: "PER_UNIT",
    priceSource: "nightly",
  });
  return {
    ...input,
    unitPrice: ratePerRoomForStay,
    breakdown: {
      type: "ACCOMMODATION_NIGHTLY",
      checkIn: nightlyRates[0].date,
      checkOut: toLocalDateKey(draft.hotel.checkOut),
      nights: nightlyRates.length,
      roomsCount,
      nightlyRates,
    },
  };
};

export const buildAuthoritativeDraftQuote = async ({ draft, coupon = null, now = new Date() }) => {
  const externalInput = buildExternalFlightInput(draft);
  if (externalInput) return calculatePricingQuote([externalInput], { now });

  const accommodationInput = await buildAccommodationPricingInput(draft);
  if (accommodationInput) {
    return calculatePricingQuote([accommodationInput], { now, coupon });
  }

  const travelersCount = travelerCountOf(draft);
  const lines = [];
  const programInput = await buildProgramInput({ draft, travelersCount });
  if (programInput) lines.push(programInput);

  const readyPackage = String(draft.bookingContext || "").toUpperCase() === "READY_PACKAGE";
  for (const item of selectedProductsOf(draft)) {
    if (readyPackage && item.isExtra !== true && item.extra !== true && item.includedInPackage !== false) {
      continue;
    }
    const line = await buildLocalProductInput({ item, draft, travelersCount });
    if (line) lines.push(line);
  }

  if (!lines.length) throw new AppError("PRICING_LINES_REQUIRED", 400, "selectedProducts");
  return calculatePricingQuote(lines, { now, coupon });
};

const quoteFingerprint = (quote = {}) => JSON.stringify({
  version: Number(quote.version || 0),
  currency: String(quote.currency || ""),
  lines: (quote.lines || []).map((line) => ({
    sourceType: line.sourceType,
    sourceId: String(line.sourceId || ""),
    chargeType: line.chargeType,
    unitPrice: Number(line.unitPrice || 0),
    quantity: Number(line.quantity || 0),
    subtotal: Number(line.subtotal || 0),
    adminDiscount: {
      type: line.adminDiscount?.type || null,
      value: Number(line.adminDiscount?.value || 0),
      amount: Number(line.adminDiscount?.amount || 0),
      applied: line.adminDiscount?.applied === true,
    },
    couponDiscountAmount: Number(line.couponDiscountAmount || 0),
    taxableAmount: Number(line.taxableAmount || 0),
    tax: {
      enabled: line.tax?.enabled === true,
      rate: Number(line.tax?.rate || 0),
      inclusive: line.tax?.inclusive === true,
      amount: Number(line.tax?.amount || 0),
    },
    total: Number(line.total || 0),
    breakdown: line.breakdown || null,
  })),
  coupon: quote.coupon ? {
    couponId: String(quote.coupon.couponId || ""),
    code: quote.coupon.code,
    discountType: quote.coupon.discountType,
    value: Number(quote.coupon.value || 0),
  } : null,
  subtotal: Number(quote.subtotal || 0),
  adminDiscountAmount: Number(quote.adminDiscountAmount || 0),
  couponDiscountAmount: Number(quote.couponDiscountAmount || 0),
  taxableAmount: Number(quote.taxableAmount || 0),
  taxAmount: Number(quote.taxAmount || 0),
  total: Number(quote.total ?? quote.totalPrice ?? 0),
});

export const pricingQuoteChanged = (previous = {}, next = {}) =>
  quoteFingerprint(previous) !== quoteFingerprint(next);
