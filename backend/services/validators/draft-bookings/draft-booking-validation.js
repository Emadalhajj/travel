import Joi from "joi";

const customerSchema = Joi.object({
  name: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  phone: Joi.string().allow("", null),
  nationality: Joi.string().allow("", null),
});

const travelerSchema = Joi.object({
  fullName: Joi.string().allow("", null),
  givenName: Joi.string().allow("", null),
  familyName: Joi.string().allow("", null),
  title: Joi.string().valid("MR", "MRS", "MS", "CHILD", "OTHER", "").allow(null),
  firstName: Joi.string().allow("", null),
  middleName: Joi.string().allow("", null),
  lastName: Joi.string().allow("", null),
  documentType: Joi.string()
    .valid("PASSPORT", "NATIONAL_ID", "RESIDENCY_ID", "GCC_ID")
    .default("PASSPORT"),
  documentNumber: Joi.string().allow("", null),
  documentIssuingCountry: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  phoneNumber: Joi.string().allow("", null),
  passengerCategory: Joi.string()
    .valid("adult", "child", "infant_without_seat")
    .default("adult"),
  responsibleAdultTravelerId: Joi.string().allow("", null),
  passportNumber: Joi.string().allow("", null),
  passportExpiryDate: Joi.date().allow(null),
  passportIssuingCountryCode: Joi.string().allow("", null),
  nationality: Joi.string().allow("", null),
  birthDate: Joi.date().allow(null),
  gender: Joi.string().valid("male", "female").allow(null),
  passportImage: Joi.string().allow("", null),
  personalPhoto: Joi.string().allow("", null),
  vaccinationCertificate: Joi.string().allow("", null),
  visaAttachment: Joi.string().allow("", null),
  mobile: Joi.string().allow("", null),
  whatsapp: Joi.string().allow("", null),
  hostId: Joi.string().allow("", null),
});

const hostSchema = Joi.object({
  hostId: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  nationalId: Joi.string().trim().required(),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/).required(),
  birthDate: Joi.date().max("now").required(),
  nationalAddress: Joi.string().trim().required(),
  idImage: Joi.string().allow("", null),
  nationalAddressImage: Joi.string().allow("", null),
});

const programSchema = Joi.object({
  programId: Joi.string().allow(null, ""),
  nameAr: Joi.string().allow("", null),
  nameEn: Joi.string().allow("", null),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
});

const hotelSchema = Joi.object({
  hotelId: Joi.string().allow(null, ""),
  roomTypeId: Joi.string().hex().length(24).allow(null, ""),
  nameAr: Joi.string().allow("", null),
  nameEn: Joi.string().allow("", null),
  roomType: Joi.string().allow("", null),
  roomTypeNameAr: Joi.string().allow("", null),
  roomTypeNameEn: Joi.string().allow("", null),
  checkIn: Joi.date().allow(null),
  checkOut: Joi.date().allow(null),
  roomsCount: Joi.number().integer().min(1),
  adults: Joi.number().integer().min(1),
  children: Joi.number().integer().min(0).default(0),
  mealPlan: Joi.string().allow("", null),
  nights: Joi.number().min(0).optional(),
});

const transportSchema = Joi.object({
  transportId: Joi.string().allow(null, ""),
  type: Joi.string().allow("", null),
  pickupLocation: Joi.string().allow("", null),
  dropoffLocation: Joi.string().allow("", null),
});

const pricingSchema = Joi.object({
  subtotal: Joi.number().min(0).default(0),
  tax: Joi.number().min(0).default(0),
  taxRate: Joi.number().min(0).default(15),
  discount: Joi.number().min(0).default(0),
  total: Joi.number().min(0).default(0),
  currency: Joi.string().default("SAR"),
});

const draftPayloadSchema = Joi.object({
  bookingContext: Joi.string()
    .valid("READY_PACKAGE", "CUSTOM_PACKAGE", "SERVICE")
    .optional(),

  serviceType: Joi.string()
    .valid("", "FLIGHT", "TRIP", "HOTEL", "ACCOMMODATION", "TRANSPORT", "VISA", "ZIYARAT", "EXTRA_SERVICE")
    .allow(null)
    .optional(),

  customer: customerSchema.optional(),

  travelers: Joi.array().items(travelerSchema).optional(),

  hosts: Joi.array().items(hostSchema).default([]),

  program: programSchema.allow(null).optional(),

  hotel: hotelSchema.allow(null).optional(),

  transport: transportSchema.allow(null).optional(),

  pricing: pricingSchema.optional(),

  currentStep: Joi.string()
    .valid(
      "choose_package",
      "customer_info",
      "pilgrims",
      "services",
      "documents",
      "review",
      "payment",
      "success",
    )
    .optional(),

  data: Joi.object().unknown(true).default({}),
}).custom((value, helpers) => {
  const serviceType = String(value.serviceType || "").toUpperCase();
  if (
    value.bookingContext !== "SERVICE" ||
    !["HOTEL", "ACCOMMODATION"].includes(serviceType)
  ) {
    return value;
  }

  const accommodation = value.hotel || {};
  const required = ["roomTypeId", "checkIn", "checkOut", "roomsCount", "adults"];
  for (const field of required) {
    if (accommodation[field] === undefined || accommodation[field] === null || accommodation[field] === "") {
      return helpers.error("any.custom", { message: `hotel.${field} is required` });
    }
  }
  if (new Date(accommodation.checkOut) <= new Date(accommodation.checkIn)) {
    return helpers.error("any.custom", { message: "hotel.checkOut must be after hotel.checkIn" });
  }
  return value;
}, "standalone accommodation contract").options({
  stripUnknown: true,
});

export const createDraftBookingValidation = draftPayloadSchema;

export const updateDraftBookingValidation = draftPayloadSchema;

export const draftBookingIdValidation = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "Draft Booking ID is required",
    "any.required": "Draft Booking ID is required",
  }),
});
