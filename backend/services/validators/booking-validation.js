import Joi from "joi";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

import { BOOKING_STATUS_LIST, BOOKING_STATUS } from "../../constants/booking/booking-status.js";
import { PAYMENT_STATUS_LIST, PAYMENT_STATUS } from "../../constants/booking/payment-status.js";
import { BOOKING_TYPES_LIST, BOOKING_TYPES } from "../../constants/booking/booking-types.js";
import { BOOKING_STEPS_LIST, BOOKING_STEPS } from "../../constants/booking/booking-steps.js";

// ======================================================
// Pilgrim Schema
// ======================================================

const pilgrimSchema = (useArabic) =>
  Joi.object({
    passportNumber: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": useArabic
          ? "رقم الجواز مطلوب"
          : "Passport number is required",

        "any.required": useArabic
          ? "رقم الجواز مطلوب"
          : "Passport number is required",
      }),

    firstNameAr: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": useArabic
          ? "الاسم الأول بالعربية مطلوب"
          : "Arabic first name is required",
      }),

    secondNameAr: Joi.string()
      .trim()
      .allow("", null),

    thirdNameAr: Joi.string()
      .trim()
      .allow("", null),

    lastNameAr: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": useArabic
          ? "اسم العائلة بالعربية مطلوب"
          : "Arabic last name is required",
      }),

    firstNameEn: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": useArabic
          ? "الاسم الأول بالإنجليزية مطلوب"
          : "English first name is required",
      }),

    secondNameEn: Joi.string()
      .trim()
      .allow("", null),

    thirdNameEn: Joi.string()
      .trim()
      .allow("", null),

    lastNameEn: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": useArabic
          ? "اسم العائلة بالإنجليزية مطلوب"
          : "English last name is required",
      }),

    nationality: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": useArabic
          ? "الجنسية مطلوبة"
          : "Nationality is required",
      }),

    gender: Joi.string()
      .valid("male", "female")
      .required()
      .messages({
        "any.only": useArabic
          ? "الجنس غير صحيح"
          : "Invalid gender",
      }),

    birthDate: Joi.date()
      .required()
      .messages({
        "any.required": useArabic
          ? "تاريخ الميلاد مطلوب"
          : "Birth date is required",
      }),

    phone: Joi.string()
      .trim()
      .allow("", null),

    whatsapp: Joi.string()
      .trim()
      .allow("", null),

    passportExpiryDate: Joi.date()
      .allow(null),

    documents: Joi.array()
      .items(Joi.string())
      .default([]),
  });

// ======================================================
// Pricing Schema
// ======================================================

const pricingSchema = Joi.object({
  roomPrice: Joi.number().min(0).default(0),
  visaPrice: Joi.number().min(0).default(0),
  tripPrice: Joi.number().min(0).default(0),
  transportPrice: Joi.number().min(0).default(0),

  subtotal: Joi.number().min(0).default(0),

  taxRate: Joi.number().min(0).default(15),
  taxAmount: Joi.number().min(0).default(0),

  totalPrice: Joi.number().min(0).default(0),

  currency: Joi.string().default("SAR"),
});

// ======================================================
// Payment Schema
// ======================================================

const paymentSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid(
      "cash",
      "bank_transfer",
      "card",
      "mada",
      "stc_pay",
      "apple_pay",
      "visa",
      "mastercard",
    )
    .default("cash"),

paymentStatus: Joi.string()
  .valid(...PAYMENT_STATUS_LIST)
  .default(PAYMENT_STATUS.PENDING),

  transactionId: Joi.string()
    .allow("", null),

  paidAmount: Joi.number()
    .min(0)
    .default(0),

  remainingAmount: Joi.number()
    .min(0)
    .default(0),
});

// ======================================================
// Create Booking Schema
// ======================================================

export const createBookingSchema = ({
  req,
  isArabic,
} = {}) => {
  const useArabic =
    typeof isArabic === "boolean"
      ? isArabic
      : isArabicRequest(req);

  return Joi.object({
    user: Joi.string()
      .required()
      .messages({
        "any.required": useArabic
          ? "المستخدم مطلوب"
          : "User is required",
      }),

    pilgrims: Joi.array()
      .items(
        pilgrimSchema(useArabic),
      )
      .min(1)
      .required()
      .messages({
        "array.min": useArabic
          ? "يجب إضافة معتمر واحد على الأقل"
          : "At least one pilgrim is required",

        "any.required": useArabic
          ? "بيانات المعتمرين مطلوبة"
          : "Pilgrims data is required",
      }),

    // ======================
    // References
    // ======================

    visa: Joi.string()
      .allow(null, ""),

    hotel: Joi.string()
      .allow(null, ""),

    roomType: Joi.string()
      .allow(null, ""),

    transport: Joi.string()
      .allow(null, ""),

    trip: Joi.string()
      .allow(null, ""),

    // ======================
    // Dates
    // ======================

    travelDate: Joi.date()
      .required()
      .messages({
        "any.required": useArabic
          ? "تاريخ السفر مطلوب"
          : "Travel date is required",
      }),

    returnDate: Joi.date()
      .allow(null),

    checkIn: Joi.date()
      .allow(null),

    checkOut: Joi.date()
      .allow(null),

    // ======================
    // Pricing
    // ======================

    pricing: pricingSchema
      .optional()
      .default({}),

    // ======================
    // Payment
    // ======================

    payment: paymentSchema
      .optional()
      .default({}),
    //========  booking status =======
    bookingType: Joi.string()
  .valid(...BOOKING_TYPES_LIST)
  .default(BOOKING_TYPES.UMRAH_PACKAGE),

currentStep: Joi.string()
  .valid(...BOOKING_STEPS_LIST)
  .default(BOOKING_STEPS.PILGRIMS),

bookingStatus: Joi.string()
  .valid(...BOOKING_STATUS_LIST)
  .default(BOOKING_STATUS.DRAFT),

    // ======================
    // Status
    // ======================



    notes: Joi.string()
      .allow("", null),

    isActive: Joi.boolean()
      .default(true),

    data: Joi.any()
      .optional(),
  }).options({
    stripUnknown: true,
  });
};

// ======================================================
// Update Booking Schema
// ======================================================

export const updateBookingSchema = (
  context,
) => {
  const baseSchema =
    createBookingSchema(
      context,
    );

  return baseSchema.fork(
    Object.keys(
      baseSchema.describe().keys,
    ),
    (schema) =>
      schema.optional(),
  );
};