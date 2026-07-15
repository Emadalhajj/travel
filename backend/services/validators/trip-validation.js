import Joi from "joi";

export const createTripSchema = Joi.object({
  /* ======================
   * BASIC INFO
   * ====================== */
  nameEn: Joi.string().min(3).max(70).required(),
  nameAr: Joi.string().min(3).max(70).required(),
  descriptionEn: Joi.string().allow(""),
  descriptionAr: Joi.string().allow(""),

  /* ======================
   * TRIP TYPE
   * ====================== */
  tripType: Joi.string()
    .valid("tour", "transport", "package", "activity")
    .required(),

  /* ======================
   * LOCATIONS
   * ====================== */
  fromCity: Joi.string().min(2).max(50).optional(),
  toCity: Joi.string().min(2).max(50).optional(),

  /* ======================
   * DURATION & TIME
   * ====================== */
  duration: Joi.object({
    days: Joi.number().min(1),
    nights: Joi.number().min(0),
  }),
  startDate: Joi.date().optional(), 
  endDate: Joi.alternatives()
    .try(
      Joi.date().min(Joi.ref("startDate")),
      Joi.string().allow(null, ""),
      Joi.allow(null),
    )
    .optional(),
  /* ======================
   * PRICING
   * ====================== */
  pricing: Joi.object({
    basePrice: Joi.number().min(0).optional(),
    discountPrice: Joi.number().min(0).default(0),
    currency: Joi.string().default("SAR"),
  }).optional(),

  /* ======================
   * CAPACITY
   * ====================== */
  capacity: Joi.object({
    maxAdults: Joi.number().min(1).optional(),
    maxChildren: Joi.number().min(0).optional(),
  }).optional(),

  
  /* ======================
   * IMAGES
   * ====================== */
  images: Joi.array().items(Joi.string()).default([]),

  /* ======================
   * FEATURES (Dynamic Options)
   * ====================== */
    features: Joi.alternatives().try(
    Joi.object().pattern(Joi.string(), Joi.boolean()),
    Joi.string()
  ).default({}),

  /* ======================
   * SPECS (Dynamic Selects)
   * ====================== */
  specs: Joi.alternatives().try(
    Joi.object(),
    Joi.string()
  ).default({}),

  /* ======================
   * VEHICLE TYPE (Optional for transport trips)
   * ====================== */
  vehicleType: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),

  /* ======================
   * STATUS
   * ====================== */
  isActive: Joi.boolean().default(true),

  /* ======================
   * ADMIN (من السيرفر)
   * ====================== */
  createdBy: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

/*
updateTripSchema ينسخ كل الشروط والقواعد الموجودة في createTripSchema
ثم يستخدم fork() فقط لتغيير حالة بعض الحقول من required إلى optional.
*/

export const updateTripSchema = createTripSchema.fork(
  Object.keys(createTripSchema.describe().keys),
  (schema) => schema.optional(),
);
