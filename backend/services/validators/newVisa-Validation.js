import Joi from "joi";

// ✅ مخطط التحقق عند إنشاء تأشيرة جديدة
export const createVisaSchema = Joi.object({
  name: Joi.object({
    ar: Joi.string().min(3).max(100).required().messages({
      "any.required": "اسم التأشيرة بالعربية مطلوب",
      "string.empty": "اسم التأشيرة بالعربية مطلوب",
    }),
    en: Joi.string().min(3).max(100).required().messages({
      "any.required": "اسم التأشيرة بالإنجليزية مطلوب",
      "string.empty": "اسم التأشيرة بالإنجليزية مطلوب",
    }),
  }).required(),

  description: Joi.object({
    ar: Joi.string().min(5).max(1000).required().messages({
      "any.required": "الوصف بالعربية مطلوب",
      "string.empty": "الوصف بالعربية مطلوب",
    }),
    en: Joi.string().min(5).max(1000).required().messages({
      "any.required": "الوصف بالإنجليزية مطلوب",
      "string.empty": "الوصف بالإنجليزية مطلوب",
    }),
  }).required(),

  visaType: Joi.string().required().messages({
    "any.required": "نوع التأشيرة مطلوب",
  }),

  price: Joi.number().positive().required().messages({
    "number.base": "يجب أن يكون السعر رقمًا",
    "number.positive": "السعر يجب أن يكون موجبًا",
    "any.required": "السعر مطلوب",
  }),
  duration: Joi.string().required().max(365),
  validity: Joi.string().required().max(365),

  country: Joi.object({
    ar: Joi.string().required().messages({
      "any.required": "الدولة بالعربية مطلوبة",
    }),
    en: Joi.string().required().messages({
      "any.required": "الدولة بالإنجليزية مطلوبة",
    }),
  }).required(),

  isActive: Joi.boolean().default(true),
  isAlwaysAvailable: Joi.boolean().default(true),

  // ✅ حقل الصورة (اختياري)
  image: Joi.string().allow("", null).messages({
    "string.base": "رابط الصورة يجب أن يكون نصًا",
  }),
});

export const updateVisaSchema = Joi.object({
  name: Joi.object({
    ar: Joi.string().min(3).max(100),
    en: Joi.string().min(3).max(100),
  }),
  description: Joi.object({
    ar: Joi.string().min(5).max(1000),
    en: Joi.string().min(5).max(1000),
  }),
  visaType: Joi.string(),
  price: Joi.number().positive(),
  duration: Joi.string().max(365),
  validity: Joi.string().max(365),
  country: Joi.object({
    ar: Joi.string(),
    en: Joi.string(),
  }),
  isActive: Joi.boolean(),
  isAlwaysAvailable: Joi.boolean(),
  "imagesDeleted[]": Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  image: Joi.string().allow("", null),
}).min(1); // على الأقل حقل واحد
