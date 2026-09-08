import Joi from "joi";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
// import { isArabicRequest } from "../../utils/isArabicRequest.js"; // تأكد من المسار الصحيح

export const createExtraServiceSchema = ({ req, isArabic } = {}) => {
  const useArabic =
    typeof isArabic === "boolean" ? isArabic : isArabicRequest(req);

  return Joi.object({
    // معلومات أساسية
    nameAr: Joi.string()
      .min(3)
      .max(150)
      .required()
      .messages({
        "string.empty": useArabic
          ? "الاسم بالعربية مطلوب"
          : "Arabic name is required",
        "string.min": useArabic
          ? "الاسم بالعربية يجب أن يكون 3 أحرف على الأقل"
          : "Arabic name must be at least 3 characters",
        "string.max": useArabic
          ? "الاسم بالعربية لا يمكن أن يتجاوز 150 حرف"
          : "Arabic name cannot exceed 150 characters",
        "any.required": useArabic
          ? "الاسم بالعربية مطلوب"
          : "Arabic name is required",
      }),

    nameEn: Joi.string()
      .min(3)
      .max(150)
      .required()
      .messages({
        "string.empty": useArabic
          ? "الاسم بالإنجليزية مطلوب"
          : "English name is required",
        "string.min": useArabic
          ? "الاسم بالإنجليزية يجب أن يكون 3 أحرف على الأقل"
          : "English name must be at least 3 characters",
        "string.max": useArabic
          ? "الاسم بالإنجليزية لا يمكن أن يتجاوز 150 حرف"
          : "English name cannot exceed 150 characters",
        "any.required": useArabic
          ? "الاسم بالإنجليزية مطلوب"
          : "English name is required",
      }),

    descriptionAr: Joi.string()
      .max(500)
      .allow("", null)
      .optional()
      .messages({
        "string.max": useArabic
          ? "الوصف بالعربية لا يمكن أن يتجاوز 500 حرف"
          : "Arabic description cannot exceed 500 characters",
      }),

    descriptionEn: Joi.string()
      .max(500)
      .allow("", null)
      .optional()
      .messages({
        "string.max": useArabic
          ? "الوصف بالإنجليزية لا يمكن أن يتجاوز 500 حرف"
          : "English description cannot exceed 500 characters",
      }),

    // الفئة
    category: Joi.string()
      .valid(
        "airport_service",
        "insurance",
        "meal",
        "religious_guide",
        "vip_service",
        "sim_card",
        "wheelchair",
        "other",
      )
      .default("other")
      .messages({
        "any.only": useArabic
          ? "يرجى اختيار فئة صحيحة"
          : "Please select a valid category",
      }),

    // التسعير
    pricing: Joi.object({
      basePrice: Joi.number()
        .min(0)
        .required()
        .messages({
          "any.required": useArabic
            ? "السعر الأساسي مطلوب"
            : "Base price is required",
          "number.base": useArabic
            ? "يرجى إدخال سعر صحيح"
            : "Please enter a valid price",
          "number.min": useArabic
            ? "السعر لا يمكن أن يكون سالباً"
            : "Price cannot be negative",
        }),

      currency: Joi.string()
        .valid(...SUPPORTED_CURRENCIES)
        .default(DEFAULT_CURRENCY)
        .messages({
          "any.only": useArabic ? "عملة غير مدعومة" : "Unsupported currency",
        }),
    })
      .required()
      .messages({
        "any.required": useArabic
          ? "بيانات التسعير مطلوبة"
          : "Pricing information is required",
      }),

    // الصور (مصفوفة روابط)
    images: Joi.array()
      .items(Joi.string().uri().allow("", null))
      .default([])
      .optional(),

    // حالات التوافر والتفعيل
    isAlwaysAvailable: Joi.boolean().default(true),
    isActive: Joi.boolean().default(true),

    // حقول إدارية (اختيارية)
    createdBy: Joi.string().optional(),
    updatedBy: Joi.string().optional(),

    // للتوافق مع FormData
    data: Joi.any().optional(),
    deleteImages: Joi.array().items(Joi.string()).optional(),
    "deleteImages[]": Joi.alternatives()
      .try(Joi.array().items(Joi.string()), Joi.string())
      .optional(),
    "imagesDeleted[]": Joi.alternatives()
      .try(Joi.array().items(Joi.string()), Joi.string())
      .optional(),
  }).options({ stripUnknown: true });
};

// Schema للتحديث (كل الحقول اختيارية)
export const updateExtraServiceSchema = (context) => {
  const baseSchema = createExtraServiceSchema(context);

  return baseSchema.fork(Object.keys(baseSchema.describe().keys), (schema) =>
    schema.optional(),
  );
};
