import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const RoomTypeSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    // ==================== الأسماء ====================
    nameEn: {
      type: String,
      required: [true, "Room type name (English) is required"],
      trim: true,
    },
    nameAr: {
      type: String,
      required: [true, "اسم نوع الغرفة بالعربية مطلوب"],
      trim: true,
    },
    // ==================== الوصف ====================
    descriptionEn: { type: String, trim: true },
    descriptionAr: { type: String, trim: true },
    // ==================== السعة () ====================
    capacity: {
      maxAdults: { type: Number, default: 2, min: 1 },
      maxChildren: { type: Number, default: 0, min: 0 }, // يمكن إزالته إذا لم تحتاجه
    },

    // ==================== المساحة ونوع السرير ====================
    // ✅ إجمالي الأشخاص (يُحسب تلقائيًا)
    totalOccupancy: { type: Number, default: 2 },

    // المساحة ونوع السرير
    size: { type: Number, min: 1 },
    bedType: {
      type: String,
      enum: [
        "single",
        "twin",
        "double",
        "queen",
        "king",
        "triple",
        "quad",
        "quintuple",
        "family",
        "suite",
      ],
      default: "quad",
    },
    //===================        ============
    size: { type: Number }, // متر مربع
    bedType: {
      type: String,
      enum: [
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
      ],
      default: "quad",
    },
    // عدد الغرف المتاحة من هذا النوع
    totalRooms: { type: Number, default: 1, min: 1 },
    amenities: [{ type: String }],

    // ✅ التسعير المرن (الجديد)
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: DEFAULT_CURRENCY,
      },

      // ✅ فترات تسعير متعددة (أسعار موسمية، نهاية أسبوع، عطل...)
      pricingPeriods: [
        {
          nameAr: { type: String, required: true },
          nameEn: { type: String, required: true },

          periodType: {
            type: String,
            enum: ["weekend", "seasonal", "holiday", "custom"],
            required: true,
          },

          // للأيام المحددة (نهاية أسبوع)
          days: [
            {
              type: String,
              enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
          ],

          // للفترات الزمنية (موسمي، عطل)
          startDate: Date,
          endDate: Date,

          price: {
            type: Number,
            required: true,
            min: 0,
          },

          isActive: {
            type: Boolean,
            default: true,
          },

          priority: {
            type: Number,
            default: 0, // أولوية أعلى = يُطبق أولاً
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      // ✅ خصم عام (يُطبق على السعر الأساسي فقط)
      discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // ==================== الوجبات ====================
    mealPlan: {
      type: String,
      enum: [
        "room_only",
        "breakfast",
        "half_board",
        "full_board",
        "all_inclusive",
      ],
      default: "room_only",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    // ================== الصور ==================
    images: [{ type: String }], // تخزين روابط الصور فقط، يمكنك تعديلها لتخزين كائنات تحتوي على url و alt إذا أردت
    // availableRooms: { type: Number, default: 0 }, // عدد الغرف المتاحة من هذا النوع
    //===================== التوافر ====================
    availability: {
      availablePeriods: [
        {
          nameAr: String,
          nameEn: String,

          startDate: {
            type: Date,
            required: true,
          },

          endDate: {
            type: Date,
            required: true,
          },

          isActive: {
            type: Boolean,
            default: true,
          },

          notes: String,
        },
      ],
    },

    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    updatedBy: {
      // ← أضف هذا
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    // slug:        String,
  },
  { timestamps: true },
);

// Virtual للسعر النهائي بعد الخصم
RoomTypeSchema.virtual("computedFinalPrice").get(function () {
  const discount = this.pricing.discountPercent || 0;
  return this.pricing.basePrice * (1 - discount / 100);
});
// ✅ Virtual: إجمالي الأشخاص (للعرض فقط)
RoomTypeSchema.virtual("computedTotalOccupancy").get(function () {
  return (this.capacity?.maxAdults || 0) + (this.capacity?.maxChildren || 0);
});
// ✅ Pre-save: حساب القيم التلقائية قبل الحفظ
RoomTypeSchema.pre("save", function (next) {
  // حساب إجمالي الأشخاص
  this.totalOccupancy =
    (this.capacity?.maxAdults || 0) + (this.capacity?.maxChildren || 0);

  // حساب السعر بعد الخصم
  const base = this.pricing?.basePrice || 0;
  const discount = this.pricing?.discountPercent || 0;
  this.pricing.finalPrice = base * (1 - discount / 100);

  next();
});
// ✅ Pre-update: نفس الحسابات عند التحديث
RoomTypeSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  const update = this.getUpdate();

  if (update.capacity || update.$set?.capacity) {
    const cap = update.capacity || update.$set.capacity;
    update.totalOccupancy = (cap.maxAdults || 0) + (cap.maxChildren || 0);
  }

  if (update.pricing || update.$set?.pricing) {
    const pricing = update.pricing || update.$set.pricing;
    const base = pricing.basePrice || 0;
    const discount = pricing.discountPercent || 0;
    pricing.finalPrice = base * (1 - discount / 100);
  }

  next();
});

// Index للبحث السريع
RoomTypeSchema.index({ hotel: 1, isActive: 1 }); // لتحسين أداء البحث عن أنواع الغرف النشطة لفندق معين
RoomTypeSchema.index({ "pricing.basePrice": 1 }); // لتحسين أداء البحث والترتيب حسب السعر الأساسي

// export default mongoose.model("RoomType", RoomTypeSchema);
const RoomType =
  mongoose.models.RoomType || mongoose.model("RoomType", RoomTypeSchema);

export default RoomType;
