import mongoose from "mongoose";
import slugify from "slugify";

// MongoDB / Mongoose Schema مثال (يمكن تحويله إلى Prisma أو TypeORM)
const HotelSchema = new mongoose.Schema(
  {
    // === الأساسيات ===
    nameEn: {
      type: String,
      required: [true, "Hotel name (English) is required"],
      trim: true,
    },
    nameAr: {
      type: String,
      required: [true, "Hotel name (Arabic) is required"],
      trim: true,
    }, // غرفة قياسية، جناح جونيور، فيلا مطلة على البحر...
    // slug (SEO) - unique when present. make it sparse so documents without slug
    // don't conflict on null values.
    slug: { type: String, unique: true, sparse: true }, //تعريف حقل slug كحقل نصي فريد ولكنه اختياري (sparse) للسماح بوجود مستندات بدون slug

    descriptionEn: {
      type: String,
      trim: true,
    },
    descriptionAr: {
      type: String,
      trim: true,
    },

    stars: { type: Number, min: 1, max: 5, default: 3 }, // أو 0 للشقق والـ hostels
    hotelType: {
      type: String,
      enum: [
        "hotel",
        "resort",
        "apartment",
        "hostel",
        "villa",
        "ryokan",
        "motel",
      ],
      default: "hotel",
    },

    // === الموقع الجغرافي (مهم جداً للبحث والخرائط) ===
    location: {
      country: { ar: String, en: String, code: String }, // SA, EG, TR...
      city: { ar: String, en: String },
      area: String, // مثال: الكورنيش، تقسيم، مكة المكرمة
      address: { ar: String, en: String },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      googleMapsLink: String,
    },

    // === بيانات التواصل ===
    contact: {
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      whatsapp: { type: String, trim: true, default: "" },
    },

    // === الصور ===
    images: [{ type: String }], // ← مصفوفة من المسارات
    attachments: [
      {
        fileName: String,
        url: String,
        originalName: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ], // ملفات أخرى (عقود، صور إضافية...)

    // === المرافق (Facilities) ===
    facilities: [{ type: String }],

    // === أنواع الغرف (الأهم على الإطلاق في الحجز) ===
    roomTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
      },
    ],

    // === سياسات الفندق ===
    policies: {
      checkIn: String, // "14:00"
      checkOut: String, // "12:00"
      cancellationDays: Number, // عدد الأيام المسموح فيها إلغاء مجاني
      childPolicy: String,
      petPolicy: String, //
    },

    // === حالة الفندق ===
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    rankingScore: { type: Number, default: 0 }, // للترتيب في البحث
    
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // === إحصائيات ===
    totalBookings: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviewScore: { type: Number, default: 0 }, // من 10
  },
  { timestamps: true },
);
// ✅ توليد slug تلقائياً
HotelSchema.pre("save", async function (next) {
  if (!this.isModified("nameEn") && !this.isModified("nameAr")) return next();

  const baseSlug = slugify(this.nameEn || this.nameAr, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (await this.constructor.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;

  next();
});

// HotelSchema.pre("save", function (next) {
//   if (!this.slug) {
//     const baseName = this.nameEn || this.nameAr;
//     this.slug = slugify(baseName, {
//       lower: true,
//       strict: true,
//     });
//   }
//   next();
// });

export default mongoose.model("Hotel", HotelSchema);
