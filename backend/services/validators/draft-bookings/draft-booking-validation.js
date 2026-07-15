import Joi from "joi";

const customerSchema = Joi.object({
  name: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  phone: Joi.string().allow("", null),
  nationality: Joi.string().allow("", null),
});

const travelerSchema = Joi.object({
  fullName: Joi.string().allow("", null),
  passportNumber: Joi.string().allow("", null),
  nationality: Joi.string().allow("", null),
  birthDate: Joi.date().allow(null),
  gender: Joi.string().valid("male", "female").allow(null),
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
  nameAr: Joi.string().allow("", null),
  nameEn: Joi.string().allow("", null),
  roomType: Joi.string().allow("", null),
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
  customer: customerSchema.optional(),

  travelers: Joi.array().items(travelerSchema).optional(),

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
}).options({
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
