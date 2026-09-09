import Joi from "joi";

import {
  TRIP_DEPARTURE_STATUS_VALUES,
} from "../../constants/trips/trip-departure.constants.js";
import {
  TRIP_SOURCE_VALUES,
} from "../../constants/trips/trip.constants.js";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "../../constants/currencies.js";

const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

/*
يتحقق من شكل المقطع وتوافق وقت وصوله مع وقت مغادرته فقط.
ترتيب المقاطع وعلاقتها ببعضها مسؤولية Domain Service.
*/
const segmentSchema = Joi.object({
  sequence: Joi.number().integer().min(0).default(0),
  from: Joi.string().trim().allow("").default(""),
  to: Joi.string().trim().allow("").default(""),
  departureAt: Joi.date().allow(null).optional(),
  arrivalAt: Joi.date().allow(null).optional(),
  transportId: objectIdSchema.allow(null, "").optional(),
  carrierCode: Joi.string().trim().allow("").default(""),
  carrierName: Joi.string().trim().allow("").default(""),
  serviceNumber: Joi.string().trim().allow("").default(""),
  departureTerminal: Joi.string().trim().allow("").default(""),
  arrivalTerminal: Joi.string().trim().allow("").default(""),
  metadata: Joi.object().unknown(true).allow(null).optional(),
})
  .custom((value, helpers) => {
    if (
      value.departureAt &&
      value.arrivalAt &&
      new Date(value.arrivalAt) <= new Date(value.departureAt)
    ) {
      return helpers.error("segment.invalidDates");
    }

    return value;
  }, "Segment dates validation")
  .messages({
    "segment.invalidDates":
      "وقت وصول المقطع يجب أن يكون بعد وقت المغادرة",
  });

const pricingSchema = Joi.object({
  basePrice: Joi.number().min(0).default(0),
  discountPrice: Joi.number().min(0).default(0),
  currency: Joi.string()
    .valid(...SUPPORTED_CURRENCIES)
    .default(DEFAULT_CURRENCY),
});

const capacitySchema = Joi.object({
  totalSeats: Joi.number().integer().min(0).default(0),
});

const providerSnapshotSchema = Joi.object({
  offerId: Joi.string().trim().allow("").default(""),
  offerRequestId: Joi.string().trim().allow("").default(""),
  total: Joi.number().min(0).default(0),
  currency: Joi.string().trim().allow("").default(""),
  expiresAt: Joi.date().allow(null).optional(),
});

export const createTripDepartureSchema = Joi.object({
  tripId: objectIdSchema.required(),
  departureAt: Joi.date().required(),
  arrivalAt: Joi.date()
    .greater(Joi.ref("departureAt"))
    .allow(null)
    .optional(),
  status: Joi.string()
    .valid(...TRIP_DEPARTURE_STATUS_VALUES)
    .optional(),
  source: Joi.string()
    .valid(...TRIP_SOURCE_VALUES)
    .optional(),
  providerId: Joi.string().trim().allow("").default(""),
  externalId: Joi.string().trim().allow("").default(""),
  providerSnapshot: providerSnapshotSchema.optional(),
  serviceNumber: Joi.string().trim().allow("").default(""),
  pricing: pricingSchema.optional(),
  capacity: capacitySchema.optional(),
  segments: Joi.array().items(segmentSchema).default([]),
  notesAr: Joi.string().trim().allow("").default(""),
  notesEn: Joi.string().trim().allow("").default(""),
  isActive: Joi.boolean().default(true),
});

export const updateTripDepartureSchema = createTripDepartureSchema.fork(
  Object.keys(createTripDepartureSchema.describe().keys),
  (schema) => schema.optional(),
);
