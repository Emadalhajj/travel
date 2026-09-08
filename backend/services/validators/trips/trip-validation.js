import Joi from "joi";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../../constants/currencies.js";

import {
  TRIP_TYPE_VALUES,
  TRIP_SCOPE_VALUES,
  TRIP_SOURCE_VALUES,
  ALL_TRIP_SUBTYPE_VALUES,
  isTripSubtypeAllowed,
} from "../../../constants/trips/trip.constants.js";

const objectIdSchema = Joi.string().pattern(
  /^[0-9a-fA-F]{24}$/,
);

/*
=====================================================
TRIP TYPE RELATION VALIDATION
=====================================================

يتأكد من أن subtype متوافق مع type.

مثال صحيح:
LAND + TRANSPORT

مثال غير صحيح:
AIR + CRUISE
*/

const validateTripSubtype = (value, helpers) => {
  const { type, subtype } = value;

  // خلال مرحلة Migration الحقول الجديدة اختيارية.
  if (!type || !subtype) {
    return value;
  }

  if (!isTripSubtypeAllowed(type, subtype)) {
    return helpers.error("trip.invalidSubtype", {
      type,
      subtype,
    });
  }

  return value;
};

/*
=====================================================
CREATE TRIP
=====================================================
*/

export const createTripSchema = Joi.object({
  /* ======================
   * BASIC INFO
   * ====================== */

  nameEn: Joi.string()
    .trim()
    .min(3)
    .max(70)
    .required(),

  nameAr: Joi.string()
    .trim()
    .min(3)
    .max(70)
    .required(),

  descriptionEn: Joi.string()
    .trim()
    .allow("")
    .default(""),

  descriptionAr: Joi.string()
    .trim()
    .allow("")
    .default(""),

  /* ======================
   * NEW TRIP CLASSIFICATION
   *
   * Optional مؤقتًا حتى ننتهي
   * من Migration والـFrontend.
   * ====================== */

  type: Joi.string()
    .valid(...TRIP_TYPE_VALUES)
    .required(),

  scope: Joi.string()
    .valid(...TRIP_SCOPE_VALUES)
    .required(),

  subtype: Joi.string()
    .valid(...ALL_TRIP_SUBTYPE_VALUES)
    .required(),

  source: Joi.string()
    .valid(...TRIP_SOURCE_VALUES)
    .optional(),

  /* ======================
   * LEGACY TRIP TYPE
   *
   * يبقى مؤقتًا حتى يتم نقل
   * Controller / Frontend / Data.
   * ====================== */

  tripType: Joi.string()
    .valid(
      "tour",
      "transport",
      "package",
      "activity",
    )
    .optional(),

  /* ======================
   * LOCATIONS - LEGACY
   * ====================== */

  fromCity: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  toCity: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  /* ======================
   * DURATION & TIME - LEGACY
   * ====================== */

  duration: Joi.object({
    days: Joi.number()
      .integer()
      .min(1)
      .optional(),

    nights: Joi.number()
      .integer()
      .min(0)
      .optional(),
  }).optional(),

  /*
   * Required حاليًا لأن Trip Model
   * ما زال يطلب startDate.
   *
   * سينتقل لاحقًا إلى TripDeparture.
   */
  startDate: Joi.date().optional(),

  /*
   * endDate غير موجود في Trip Model،
   * لكنه مستخدم حاليًا داخل Controller.
   *
   * نبقيه مؤقتًا حتى ننقل المنطق
   * إلى Trip Service / TripDeparture.
   */
  endDate: Joi.alternatives()
    .try(
      Joi.date().min(Joi.ref("startDate")),
      Joi.string().allow(null, ""),
      Joi.allow(null),
    )
    .optional(),

  startTime: Joi.number()
    .integer()
    .min(0)
    .max(1439)
    .optional(),

  /* ======================
   * PRICING
   * ====================== */

  pricing: Joi.object({
    basePrice: Joi.number()
      .min(0)
      .required(),

    discountPrice: Joi.number()
      .min(0)
      .default(0),

    currency: Joi.string()
      .valid(...SUPPORTED_CURRENCIES)
      .default(DEFAULT_CURRENCY),
  }).required(),

  /* ======================
   * CAPACITY - LEGACY
   *
   * totalSeats / availableSeats
   * لا نستقبلها من المستخدم.
   * ====================== */

  capacity: Joi.object({
    maxAdults: Joi.number()
      .integer()
      .min(1)
      .optional(),

    maxChildren: Joi.number()
      .integer()
      .min(0)
      .optional(),
  }).optional(),

  /* ======================
   * IMAGES
   * ====================== */

  images: Joi.array()
    .items(Joi.string())
    .default([]),

  "imagesDeleted[]": Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string(),
    )
    .optional(),

  /* ======================
   * FEATURES
   * ====================== */

  features: Joi.alternatives()
    .try(
      Joi.object().pattern(
        Joi.string(),
        Joi.boolean(),
      ),
      Joi.string(),
    )
    .default({}),

  /* ======================
   * SPECS - LEGACY
   * ====================== */

  specs: Joi.alternatives()
    .try(
      Joi.object(),
      Joi.string(),
    )
    .default({}),

  /* ======================
   * TRANSPORT REFERENCE
   *
   * الاسم vehicleType قديم،
   * لكنه فعليًا Transport ObjectId.
   * ====================== */

  vehicleType: objectIdSchema.optional(),

  transportId: Joi.when("type", {
    is: "LAND",
    then: objectIdSchema.required(),
    otherwise: objectIdSchema.allow(null, "").optional(),
  }),
  airline: Joi.string().trim().allow("").optional(),
  flightNumber: Joi.string().trim().allow("").optional(),
  originAirport: Joi.string().trim().allow("").optional(),
  destinationAirport: Joi.string().trim().allow("").optional(),
  departureTerminal: Joi.string().trim().allow("").optional(),
  arrivalTerminal: Joi.string().trim().allow("").optional(),
  cabinClass: Joi.string().trim().allow("").optional(),
  fareClass: Joi.string().trim().allow("").optional(),
  baggage: Joi.string().trim().allow("").optional(),
  aircraft: Joi.string().trim().allow("").optional(),
  routeStops: Joi.array().items(Joi.object({
    location: Joi.string().trim().required(),
    notes: Joi.string().trim().allow("").optional(),
  })).default([]),
  vesselName: Joi.string().trim().allow("").optional(),
  ports: Joi.array().items(Joi.object({
    location: Joi.string().trim().required(),
    notes: Joi.string().trim().allow("").optional(),
  })).default([]),
  cabinTypes: Joi.string().trim().allow("").optional(),
  mealsIncluded: Joi.boolean().optional(),
  baggagePolicy: Joi.string().trim().allow("").optional(),

  /* ======================
   * STATUS
   * ====================== */

  isActive: Joi.boolean().default(true),

  /* ======================
   * ADMIN
   * ====================== */

  createdBy: objectIdSchema.optional(),
})
  .custom(
    validateTripSubtype,
    "Trip subtype validation",
  )
  .messages({
    "trip.invalidSubtype":
      "subtype {{#subtype}} is not valid for trip type {{#type}}",
  });

/*
=====================================================
UPDATE TRIP
=====================================================

نستخدم نفس قواعد Create، لكن نجعل جميع
الحقول العليا Optional.

هذا يمنع تكرار Schema ثانية كاملة.
*/

export const updateTripSchema =
  createTripSchema.fork(
    Object.keys(
      createTripSchema.describe().keys,
    ),
    (schema) => schema.optional(),
  );
