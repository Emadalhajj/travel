// services/validators/umrah-programs/umrah-program-validation.js

/*
=====================================================
Umrah Program Validation
=====================================================

هذا الملف مسؤول عن التحقق من بيانات برنامج العمرة
قبل وصولها إلى controller أو service.

الهدف:
-----------------------------------------------------
- منع البيانات الناقصة
- منع القيم غير الصحيحة
- توحيد شكل البيانات المرسلة
=====================================================
*/

import Joi from "joi";

import {
  UMRAH_PROGRAM_STATUS_LIST,
} from "../../../constants/umrah-programs/umrah-program-status.js";

import {
  UMRAH_PROGRAM_TYPES_LIST,
} from "../../../constants/umrah-programs/umrah-program-types.js";

/*
=====================================================
createUmrahProgramValidation
=====================================================

التحقق عند إنشاء برنامج جديد.

الحقول المطلوبة:
-----------------------------------------------------
- nameAr
- nameEn
- startDate
- endDate
- durationDays
- pricing.basePrice
- pricing.totalPrice
- capacity.totalSeats
=====================================================
*/

export const createUmrahProgramValidation = Joi.object({
  nameAr: Joi.string().required(),
  nameEn: Joi.string().required(),

  descriptionAr: Joi.string().allow("", null),
  descriptionEn: Joi.string().allow("", null),
  shortDescriptionAr: Joi.string().allow("", null),
  shortDescriptionEn: Joi.string().allow("", null),
  serviceLevel: Joi.string()
    .valid("economy", "deluxe", "premium", "vip", "")
    .optional(),

  type: Joi.string()
    .valid(...UMRAH_PROGRAM_TYPES_LIST)
    .optional(),

  status: Joi.string()
    .valid(...UMRAH_PROGRAM_STATUS_LIST)
    .optional(),

  startDate: Joi.date().required(),
  endDate: Joi.date().required(),

  durationDays: Joi.number().min(1).required(),
  makkahNights: Joi.number().min(0).optional(),
  madinahNights: Joi.number().min(0).optional(),

  pricing: Joi.object({
    basePrice: Joi.number().min(0).required(),
    tax: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).optional(),
    totalPrice: Joi.number().min(0).required(),
    finalPrice: Joi.number().min(0).optional(),
    discountType: Joi.string()
      .valid("none", "percentage", "fixed", "")
      .optional(),
    discountPercentage: Joi.number().min(0).optional(),
    discountAmount: Joi.number().min(0).optional(),
    discountExpiresAt: Joi.date().allow(null).optional(),
    currency: Joi.string().default("SAR"),
  }).required(),

  capacity: Joi.object({
    totalSeats: Joi.number().min(1).required(),
    bookedSeats: Joi.number().min(0).optional(),
    availableSeats: Joi.number().min(0).optional(),
  }).required(),

  hotel: Joi.object({
    hotelId: Joi.string().allow(null),
    nameAr: Joi.string().allow("", null),
    nameEn: Joi.string().allow("", null),
    city: Joi.string().valid("makkah", "madinah", "both", "").optional(),
    stars: Joi.number().min(0).max(5).optional(),
    roomType: Joi.string().allow("", null),
    distanceToHaram: Joi.string().allow("", null),
  }).optional(),

  transport: Joi.object({
    transportId: Joi.string().allow(null),
    type: Joi.string()
      .valid("bus", "private_car", "flight", "train", "")
      .optional(),
    fromCity: Joi.string().allow("", null),
    toCity: Joi.string().allow("", null),
    includesAirportPickup: Joi.boolean().optional(),
  }).optional(),

  visa: Joi.object({
    included: Joi.boolean().optional(),
    type: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
  }).optional(),

  includes: Joi.array().items(Joi.string()).optional(),
  excludes: Joi.array().items(Joi.string()).optional(),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().allow(null, ""),
        category: Joi.string().allow("", null),
        categoryLabel: Joi.string().allow("", null),
        nameAr: Joi.string().allow("", null),
        nameEn: Joi.string().allow("", null),
        descriptionAr: Joi.string().allow("", null),
        descriptionEn: Joi.string().allow("", null),
        image: Joi.any().allow(null),
        priceAtTime: Joi.number().min(0).optional(),
        quantity: Joi.number().min(1).optional(),
        currency: Joi.string().default("SAR"),
        productSnapshot: Joi.object().unknown(true).allow(null),
      }),
    )
    .optional(),

  availabilityPeriod: Joi.object({
    startDate: Joi.date().allow(null),
    endDate: Joi.date().allow(null),
  }).optional(),

  termsAr: Joi.string().allow("", null),
  termsEn: Joi.string().allow("", null),

  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        publicId: Joi.string().allow(null),
      }),
    )
    .optional(),

  isFeatured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

/*
=====================================================
updateUmrahProgramValidation
=====================================================

التحقق عند تحديث برنامج.

كل الحقول اختيارية لأن المستخدم قد يعدل جزءًا واحدًا فقط.
=====================================================
*/

export const updateUmrahProgramValidation = createUmrahProgramValidation
  .fork(
    [
      "nameAr",
      "nameEn",
      "startDate",
      "endDate",
      "durationDays",
      "pricing",
      "capacity",
    ],
    (schema) => schema.optional(),
  );

/*
=====================================================
umrahProgramIdValidation
=====================================================

التحقق من id البرنامج.
=====================================================
*/

export const umrahProgramIdValidation = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "Umrah Program ID is required",
    "any.required": "Umrah Program ID is required",
  }),
});
