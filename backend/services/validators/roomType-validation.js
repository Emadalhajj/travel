// services/hotel-validation.js
import Joi from "joi";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
// ==================== Helpers ====================

const normalizeDate = (d) => {
  if (!d) return null;

  // نص YYYY-MM-DD
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const datesOverlap = (a, b) => {
  // weekend + weekend
  if (a.periodType === "weekend" && b.periodType === "weekend") {
    return a.days.some((day) => b.days?.includes(day));
  }

  // weekend + seasonal/holiday/custom → لا تداخل (weekend دائم)
  if (a.periodType === "weekend" || b.periodType === "weekend") {
    return false;
  }

  // ✅ التداخل الحقيقي فقط: < (بدون =)
  const startA = normalizeDate(a.startDate)?.getTime();
  const endA = normalizeDate(a.endDate)?.getTime();
  const startB = normalizeDate(b.startDate)?.getTime();
  const endB = normalizeDate(b.endDate)?.getTime();

  if (!startA || !endA || !startB || !endB) return false;

  // ✅ تداخل = startA < endB && startB < endA
  // ✅ تلامس = endA === startB || endB === startA → false (لا تداخل)
  return startA < endB && startB < endA;
};
// ==================== Validation Functions ====================

export const validatePricingPeriods = (periods, useArabic = true) => {
  const errors = [];

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];

    // التحقق من البيانات الأساسية
    if (period.periodType === "weekend") {
      if (!period.days || period.days.length === 0) {
        errors.push(
          useArabic
            ? `الفترة "${period.nameAr || i + 1}" تحتاج أيام محددة`
            : `Period "${period.nameEn || i + 1}" requires specific days`,
        );
      }
    }

    if (["seasonal", "holiday", "custom"].includes(period.periodType)) {
      if (!period.startDate || !period.endDate) {
        errors.push(
          useArabic
            ? `الفترة "${period.nameAr || i + 1}" تحتاج تواريخ`
            : `Period "${period.nameEn || i + 1}" requires dates`,
        );
      }
      if (period.startDate && period.endDate) {
        const start = normalizeDate(period.startDate);
        const end = normalizeDate(period.endDate);
        if (start >= end) {
          errors.push(
            useArabic
              ? `تاريخ البداية يجب أن يكون قبل النهاية`
              : `Start date must be before end date`,
          );
        }
      }
    }

    // ✅ التحقق من التداخل مع كل الفترات الأخرى
    for (let j = i + 1; j < periods.length; j++) {
      const other = periods[j];

      if (!datesOverlap(period, other)) continue;

      // ❌ رفض: تداخل حقيقي فقط
      errors.push(
        useArabic
          ? `خطأ: فترة "${period.nameAr}" (${period.periodType}) و "${other.nameAr}" (${other.periodType}) متداخلتان`
          : `Error: Period "${period.nameEn}" (${period.periodType}) and "${other.nameEn}" (${other.periodType}) overlap`,
      );
    }
  }

  return errors;
};

// ==================== Joi Schemas ====================
// Schema للإنشاء
export const createRoomTypeSchema = ({ req, isArabic } = {}) => {
  const useArabic =
    typeof isArabic === "boolean" ? isArabic : isArabicRequest(req);
  // معلومات أساسية
  return Joi.object({
    hotel: Joi.string()
      .required()
      .messages({
        "string.empty": useArabic ? "يجب اختيار الفندق" : "Hotel is required",
        "any.required": useArabic ? "الفندق مطلوب" : "Hotel is required",
      }),

    nameEn: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        "string.min": useArabic
          ? "الاسم بالإنجليزية يجب أن يكون 3 أحرف على الأقل"
          : "Name in English must be at least 3 characters long",
        "any.required": useArabic
          ? "الاسم بالإنجليزية مطلوب"
          : "Name in English is required",
      }),

    nameAr: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        "string.min": useArabic
          ? "الاسم بالعربية يجب أن يكون 3 أحرف على الأقل"
          : "Name in Arabic must be at least 3 characters long",
        "any.required": useArabic
          ? "الاسم بالعربية مطلوب"
          : "Name in Arabic is required",
      }),

    descriptionEn: Joi.string().max(500).allow("", null).optional(),
    descriptionAr: Joi.string().max(500).allow("", null).optional(),

    // السعة
    capacity: Joi.object({
      maxAdults: Joi.number().min(1).default(2),
      maxChildren: Joi.number().min(0).default(0),
      maxOccupancy: Joi.number().min(1).default(2),
    }).default({ maxAdults: 2, maxChildren: 0, maxOccupancy: 2 }),

    // تفاصيل الغرفة
    size: Joi.number().min(1).max(500).empty("").allow(null).optional(),

    bedType: Joi.string()
      .valid(
        "single",
        "twin",
        "double",
        "queen",
        "king",
        "triple",
        "quad",
        "quintuple",
        "Seven",
        "Hexagonal",
        "family",
        "suite",
      )
      .default("quad"),

    totalRooms: Joi.number().min(1).default(1),

    // الصور (اختياري في الإنشاء)
    // نتوقع مصفوفة من كائنات الصور التي يضعها الميدلوير: { url, alt, isMain? }
    newImages: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().required(),
          alt: Joi.string().allow("", null),
          isMain: Joi.boolean().optional(),
        }),
      )
      .optional(),

    // المرافق
    amenities: Joi.array()
      .items(Joi.string())
      .empty("")
      .allow(null)
      .default([]),

    //======= السعر
    pricing: Joi.object({
      basePrice: Joi.number()
        .min(0)
        .empty("")
        .required()
        .messages({
          "any.required": useArabic
            ? "يرجى ادخال السعر"
            : "please enter the price",
          "number.base": useArabic
            ? "يرجى ادخال السعر بشكل صحيح"
            : "please enter a valid price",
          "number.min": useArabic
            ? "السعر يجب ألا يكون أقل من صفر"
            : "price must not be less than zero",
        }),
      weekendPrice: Joi.number().min(0).empty("").allow(null).optional(),
      currency: Joi.string().default("SAR"),
      discountPercent: Joi.number().min(0).max(100).default(0),
      pricingPeriods: Joi.array()
        .items(
          Joi.object({
            nameAr: Joi.string().required(),
            nameEn: Joi.string().required(),
            periodType: Joi.string()
              .valid("weekend", "seasonal", "holiday", "custom")
              .required(),
            days: Joi.array()
              .items(
                Joi.string().valid(
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ),
              )
              .default([])
              .empty("")
              .allow(null)
              .optional(),
            startDate: Joi.date().empty("").allow(null).optional(),
            endDate: Joi.date().empty("").allow(null).optional(),
            price: Joi.number().min(0).required(),
            isActive: Joi.boolean().default(true),
            priority: Joi.number().default(0),
            createdAt: Joi.date().default(Date.now), // ← جديد
          }),
        )
        .default([]),
    })
      .optional()
      .empty("")
      .allow(null),

    // نظام الوجبات
    mealPlan: Joi.string()
      .valid(
        "room_only",
        "breakfast",
        "half_board",
        "full_board",
        "all_inclusive",
      )
      .default("room_only"),

    // حالة التفعيل
    isActive: Joi.boolean().default(true),
    // توافر الغرفة
    availability: Joi.object({
  availablePeriods: Joi.array()
    .items(
      Joi.object({
        nameAr: Joi.string().allow("", null).optional(),
        nameEn: Joi.string().allow("", null).optional(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        isActive: Joi.boolean().default(true),
        notes: Joi.string().allow("", null).optional(),
      }),
    )
    .default([]),
})
  .default({ availablePeriods: [] }),

    // حقول إضافية يمكن أن ترسل من FormData
    data: Joi.any().optional(), // سيتم حذفه في parseFormData
    //
  }).options({ stripUnknown: true }); // حذف الحقول غير المعروفة
};
// Schema للتحديث
export const updateRoomTypeSchema = (context) => {
  const baseSchema = createRoomTypeSchema(context);

  return baseSchema.fork(Object.keys(baseSchema.describe().keys), (schema) =>
    schema.optional(),
  );
};
