// models/umrah-programs/umrah-program-model.js

/*
=====================================================
Umrah Program Model
=====================================================

هذا الموديل يمثل برنامج أو باقة عمرة داخل النظام.

يستخدم في:
-----------------------------------------------------
- عرض البرامج للعملاء
- إنشاء حجوزات من برنامج محدد
- ربط البرنامج بالفندق والنقل والتأشيرة
- إدارة السعة والمقاعد المتاحة
- تحديد السعر والمدة والتواريخ

العلاقة المستقبلية:
-----------------------------------------------------
Booking يمكن أن يحتوي على programId يشير إلى هذا الموديل.

DraftBooking يمكن أن يحتوي على programId قبل تحويله إلى Booking.
=====================================================
*/

import mongoose from "mongoose";

import {
  UMRAH_PROGRAM_STATUS,
  UMRAH_PROGRAM_STATUS_LIST,
} from "../../constants/umrah-programs/umrah-program-status.js";

import {
  UMRAH_PROGRAM_TYPES,
  UMRAH_PROGRAM_TYPES_LIST,
} from "../../constants/umrah-programs/umrah-program-types.js";

const umrahProgramSchema = new mongoose.Schema(
  {
    /*
    =====================================================
    Basic Information
    =====================================================

    البيانات الأساسية للبرنامج.
    */

    nameAr: {
      type: String,
      required: true,
      trim: true,
    },

    nameEn: {
      type: String,
      required: true,
      trim: true,
    },

    descriptionAr: {
      type: String,
      default: "",
      trim: true,
    },

    descriptionEn: {
      type: String,
      default: "",
      trim: true,
    },

    shortDescriptionAr: {
      type: String,
      default: "",
      trim: true,
    },

    shortDescriptionEn: {
      type: String,
      default: "",
      trim: true,
    },

    serviceLevel: {
      type: String,
      enum: ["economy", "deluxe", "premium", "vip", ""],
      default: "economy",
      index: true,
    },

    /*
    نوع البرنامج:
    economy / standard / vip / ramadan / land / air
    */
    type: {
      type: String,
      enum: UMRAH_PROGRAM_TYPES_LIST,
      default: UMRAH_PROGRAM_TYPES.STANDARD,
      index: true,
    },

    /*
    حالة البرنامج:
    draft / active / inactive / sold_out / expired
    */
    status: {
      type: String,
      enum: UMRAH_PROGRAM_STATUS_LIST,
      default: UMRAH_PROGRAM_STATUS.DRAFT,
      index: true,
    },

    /*
    =====================================================
    Dates & Duration
    =====================================================

    تواريخ البرنامج ومدة الإقامة.
    */

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },

    makkahNights: {
      type: Number,
      default: 0,
      min: 0,
    },

    madinahNights: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    =====================================================
    Pricing
    =====================================================

    السعر الأساسي للبرنامج.
    */

    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },

      tax: {
        type: Number,
        default: 0,
        min: 0,
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      finalPrice: {
        type: Number,
        default: 0,
        min: 0,
      },

      discountType: {
        type: String,
        enum: ["none", "percentage", "fixed", ""],
        default: "none",
      },

      discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
      },

      discountAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      discountExpiresAt: {
        type: Date,
        default: null,
      },

      currency: {
        type: String,
        enum: ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "TRY"],
        default: "SAR",
      },
    },

    /*
    =====================================================
    Capacity
    =====================================================

    السعة المتاحة للبرنامج.
    */

    capacity: {
      totalSeats: {
        type: Number,
        required: true,
        min: 1,
      },

      bookedSeats: {
        type: Number,
        default: 0,
        min: 0,
      },

      availableSeats: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    /*
    =====================================================
    Selected Services
    =====================================================

    Snapshot of the selected products used to build this
    package. Keeping a snapshot preserves the package price
    and labels even if the original product changes later.
    */

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
        },

        category: {
          type: String,
          default: "",
          index: true,
        },

        categoryLabel: {
          type: String,
          default: "",
        },

        nameAr: {
          type: String,
          default: "",
        },

        nameEn: {
          type: String,
          default: "",
        },

        descriptionAr: {
          type: String,
          default: "",
        },

        descriptionEn: {
          type: String,
          default: "",
        },

        image: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },

        priceAtTime: {
          type: Number,
          default: 0,
          min: 0,
        },

        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },

        currency: {
        type: String,
        enum: ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "TRY"],
        default: "SAR",
      },

        productSnapshot: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
      },
    ],

    availabilityPeriod: {
      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },
    },

    /*
    =====================================================
    Hotel Information
    =====================================================

    معلومات الفندق المرتبط بالبرنامج.

    لاحقًا يمكن ربط hotelId بموديل Hotel.
    */

    hotel: {
      hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
        default: null,
      },

      nameAr: {
        type: String,
        default: "",
      },

      nameEn: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        enum: ["makkah", "madinah", "both", ""],
        default: "",
      },

      stars: {
        type: Number,
        default: 0,
      },

      roomType: {
        type: String,
        default: "",
      },

      distanceToHaram: {
        type: String,
        default: "",
      },
    },

    /*
    =====================================================
    Transport Information
    =====================================================

    معلومات النقل المرتبط بالبرنامج.
    */

    transport: {
      transportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transport",
        default: null,
      },

      type: {
        type: String,
        enum: ["bus", "private_car", "flight", "train", ""],
        default: "",
      },

      fromCity: {
        type: String,
        default: "",
      },

      toCity: {
        type: String,
        default: "",
      },

      includesAirportPickup: {
        type: Boolean,
        default: false,
      },
    },

    /*
    =====================================================
    Visa Information
    =====================================================

    هل البرنامج يشمل التأشيرة؟
    */

    visa: {
      included: {
        type: Boolean,
        default: false,
      },

      type: {
        type: String,
        default: "",
      },

      notes: {
        type: String,
        default: "",
      },
    },

    /*
    =====================================================
    Program Includes / Excludes
    =====================================================

    ما الذي يشمله البرنامج وما الذي لا يشمله.
    */

    includes: [
      {
        type: String,
        trim: true,
      },
    ],

    excludes: [
      {
        type: String,
        trim: true,
      },
    ],

    /*
    =====================================================
    Terms & Conditions
    =====================================================

    شروط البرنامج.
    */

    termsAr: {
      type: String,
      default: "",
    },

    termsEn: {
      type: String,
      default: "",
    },

    /*
    =====================================================
    Media
    =====================================================

    صور البرنامج.
    */

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          default: null,
        },
      },
    ],

    /*
    =====================================================
    Visibility
    =====================================================

    التحكم في ظهور البرنامج في الواجهة.
    */

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
    =====================================================
    Metadata
    =====================================================

    بيانات الإنشاء والتعديل.
    */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
    =====================================================
    Soft Delete
    =====================================================

    حذف ناعم بدل الحذف النهائي.
    */

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
=====================================================
Pre Save Hook
=====================================================

قبل حفظ البرنامج نحسب availableSeats تلقائيًا
إذا لم يتم إرسالها بشكل صحيح.

availableSeats = totalSeats - bookedSeats
=====================================================
*/

umrahProgramSchema.pre("save", function (next) {
  if (this.capacity) {
    const totalSeats = this.capacity.totalSeats || 0;
    const bookedSeats = this.capacity.bookedSeats || 0;

    this.capacity.availableSeats = Math.max(totalSeats - bookedSeats, 0);

    if (this.capacity.availableSeats === 0) {
      this.status = UMRAH_PROGRAM_STATUS.SOLD_OUT;
    }
  }

  next();
});

const UmrahProgram =
  mongoose.models.UmrahProgram ||
  mongoose.model("UmrahProgram", umrahProgramSchema);

export default UmrahProgram;
