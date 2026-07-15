import Joi from "joi";

export const createHotelSchema = (lang = "ar") => {
  const isArabic = lang === "ar";

  return Joi.object({
    nameEn: Joi.string()
      .min(3)
      .max(70)
      .required()
      .messages({
        "string.empty": isArabic
          ? "الاسم بالإنجليزية مطلوب"
          : "English name is required",
        "any.required": isArabic
          ? "الاسم بالإنجليزية مطلوب"
          : "English name is required",
      }),

    nameAr: Joi.string()
      .min(3)
      .max(70)
      .required()
      .messages({
        "string.empty": isArabic
          ? "الاسم العربي مطلوب"
          : "Arabic name is required",
        "any.required": isArabic
          ? "الاسم العربي مطلوب"
          : "Arabic name is required",
      }),

    descriptionEn: Joi.string().allow("").max(2000).optional(),
    descriptionAr: Joi.string().allow("").max(2000).optional(),

    stars: Joi.number()
      .messages({
        "number.base": isArabic
          ? "يجب أن يكون عدد النجوم رقماً"
          : "Number of stars must be a number",
        "any.required": isArabic
          ? "عدد النجوم مطلوب"
          : "Number of stars is required",
      })
      .required(),

    hotelType: Joi.string()
      .valid(
        "hotel",
        "resort",
        "apartment",
        "hostel",
        "villa",
        "ryokan",
        "motel",
      )
      .required()
      .messages({
        "any.only": isArabic ? "نوع الفندق غير صالح" : "Invalid hotel type",
        "any.required": isArabic
          ? "نوع الفندق مطلوب"
          : "Hotel type is required",
        "string.empty": isArabic
          ? "نوع الفندق مطلوب"
          : "Hotel type is required",
      }),

    location: Joi.object({
      country: Joi.object({
        ar: Joi.string().allow(""),
        en: Joi.string().allow(""),
        code: Joi.string().allow(""),
      }).default({}),

      city: Joi.object({
        ar: Joi.string().allow(""),
        en: Joi.string().allow(""),
      }).default({}),

      area: Joi.string().allow("").default(""),
      address: Joi.object({
        ar: Joi.string().allow(""),
        en: Joi.string().allow(""),
      }).default({}),

      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).allow(null, ""),
        lng: Joi.number().min(-180).max(180).allow(null, ""),
      }).default({}),

      googleMapsLink: Joi.string().allow("").default(""),
    }).default({}),

    contact: Joi.object({
      phone: Joi.string().allow("")
      
        // .messages({
        //   "string.empty": isArabic
        //     ? "رقم الهاتف مطلوب"
        //     : "Phone number is required",
        //   "any.required": isArabic
        //     ? "رقم الهاتف مطلوب"
        //     : "Phone number is required",
        // })
        ,
      email: Joi.string().allow("")
        .email()
        
        // .messages({
        //   "string.empty": isArabic
        //     ? "البريد الإلكتروني مطلوب"
        //     : "Email is required",
        //   "string.email": isArabic
        //     ? "البريد الإلكتروني غير صحيح"
        //     : "Invalid email",
        //   "any.required": isArabic
        //     ? "البريد الإلكتروني مطلوب"
        //     : "Email is required",
        // })
        ,
      website: Joi.string().allow(""),
      whatsapp: Joi.string().allow(""),
    }).default({}),

    facilities: Joi.alternatives()
      .try(Joi.array().items(Joi.string()), Joi.string(), Joi.allow(null))
      .default([]), // ← default([])

    roomTypes: Joi.array().items(Joi.string()).default([]),

    policies: Joi.object({
      checkIn: Joi.string().allow("").default(""),
      checkOut: Joi.string().allow("").default(""),
      cancellationDays: Joi.number().min(0).allow(null).default(0),
      childPolicy: Joi.string().allow("").default(""),
      petPolicy: Joi.string().allow("").default(""),
    }).default({}),

    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
  }).unknown(true); // للسماح بالحقول الأخرى غير المعرفة في السكيما
};
// ====================== Update Schema ======================
export const updateHotelSchema = (lang = "ar") => {
  const baseSchema = createHotelSchema(lang);

  return baseSchema.fork(Object.keys(baseSchema.describe().keys), (schema) =>
    schema.optional(),
  );
};
