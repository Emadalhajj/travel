/*
يستخدم ObjectId refs مثل بقية الموديلات.
يحفظ snapshot للأسعار والأسماء وقت الحجز.
يدعم تعدد المعتمرين داخل نفس الحجز.
يدعم المرفقات المطلوبة للتأشيرات.
يدعم draft booking.
يدعم الدفع الجزئي والكامل.
يدعم Counter لتوليد bookingNumber لاحقاً داخل الـ controller.
لا يكرر بيانات الفنادق أو الغرف أو التأشيرات الموجودة لديك بالفعل.
متوافق مع buildSearchQuery, buildPagination, populate, و Joi validation التي تستخدمها حالياً.
 */
import mongoose from "mongoose";

import {
  BOOKING_STATUS_LIST,
  BOOKING_STATUS,
} from "../../constants/booking/booking-status.js";
import {
  PAYMENT_STATUS_LIST,
  PAYMENT_STATUS,
} from "../../constants/booking/payment-status.js";
import {
  BOOKING_TYPES_LIST,
  BOOKING_TYPES,
} from "../../constants/booking/booking-types.js";
import {
  BOOKING_STEPS_LIST,
  BOOKING_STEPS,
} from "../../constants/booking/booking-steps.js";

const pilgrimSchema = new mongoose.Schema(
  {
    passportNumber: {
      type: String,
      required: true,
      trim: true,
    },

    firstNameAr: {
      type: String,
      required: true,
      trim: true,
    },

    secondNameAr: {
      type: String,
      trim: true,
      default: "",
    },

    thirdNameAr: {
      type: String,
      trim: true,
      default: "",
    },

    lastNameAr: {
      type: String,
      required: true,
      trim: true,
    },

    firstNameEn: {
      type: String,
      required: true,
      trim: true,
    },

    secondNameEn: {
      type: String,
      trim: true,
      default: "",
    },

    thirdNameEn: {
      type: String,
      trim: true,
      default: "",
    },

    lastNameEn: {
      type: String,
      required: true,
      trim: true,
    },

    nationality: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },

    birthDate: {
      type: Date,
      required: true,
    },

    mobile: {
      type: String,
      trim: true,
      default: "",
    },

    whatsapp: {
      type: String,
      trim: true,
      default: "",
    },

    isMainPilgrim: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,

    originalName: String,

    url: String,

    documentType: {
      type: String,
      enum: [
        "passport",
        "personal_photo",
        "mahram_certificate",
        "vaccination",
        "medical_report",
        "other",
      ],
      default: "other",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const bookingCustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    nationality: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const bookingProgramSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UmrahProgram",
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

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const bookingItemSchema = new mongoose.Schema(
  {
    room: {
      roomTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
      },

      roomNameAr: String,
      roomNameEn: String,

      hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },

      hotelNameAr: String,
      hotelNameEn: String,

      checkIn: Date,
      checkOut: Date,

      price: {
        type: Number,
        default: 0,
      },
    },

    visa: {
      visaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Visa",
      },

      visaNameAr: String,
      visaNameEn: String,

      price: {
        type: Number,
        default: 0,
      },
    },

    trip: {
      tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
      },

      tripNameAr: String,
      tripNameEn: String,

      travelDate: Date,
      returnDate: Date,

      price: {
        type: Number,
        default: 0,
      },
    },

    transport: {
      transportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transport",
      },

      transportNameAr: String,
      transportNameEn: String,

      vehicleType: String,

      price: {
        type: Number,
        default: 0,
      },
    },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customer: {
      type: bookingCustomerSchema,
      default: () => ({}),
    },

    program: {
      type: bookingProgramSchema,
      default: () => ({}),
    },

    pilgrims: [pilgrimSchema],

    totalPilgrims: {
      type: Number,
      default: 1,
    },
    /*
=====================================================
Soft Delete Fields
=====================================================

هذه الحقول تستخدم للحذف الناعم بدل الحذف النهائي.
=====================================================
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

    /*
     * references
     * --------------------
     */

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },

    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
    },

    visa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visa",
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },

    transport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
    },

    /*
     * snapshot
     * --------------------
     */

    bookingItems: bookingItemSchema,

    /*
     * pricing
     * --------------------
     */

    pricing: {
      roomPrice: {
        type: Number,
        default: 0,
      },

      visaPrice: {
        type: Number,
        default: 0,
      },

      tripPrice: {
        type: Number,
        default: 0,
      },

      transportPrice: {
        type: Number,
        default: 0,
      },

      subtotal: {
        type: Number,
        default: 0,
      },

      taxRate: {
        type: Number,
        default: 15,
      },

      taxAmount: {
        type: Number,
        default: 0,
      },

      totalPrice: {
        type: Number,
        default: 0,
      },

      currency: {
        type: String,
        enum: ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "TRY"],
        default: "SAR",
      },
    },

    /*
     * payment
     * --------------------
     */

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_LIST,
      default: PAYMENT_STATUS.PENDING,
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    /*
     * booking status
     * --------------------
     */

    bookingType: {
      type: String,
      enum: BOOKING_TYPES_LIST,
      default: BOOKING_TYPES.UMRAH_PACKAGE,
    },

    currentStep: {
      type: String,
      enum: BOOKING_STEPS_LIST,
      default: BOOKING_STEPS.PILGRIMS,
    },

    bookingStatus: {
      type: String,
      enum: BOOKING_STATUS_LIST,
      default: BOOKING_STATUS.DRAFT,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    attachments: [attachmentSchema],

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: Date,

    confirmedAt: Date,
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Virtuals
|--------------------------------------------------------------------------
*/

bookingSchema.virtual("isPaid").get(function () {
  return this.paymentStatus === "paid";
});

bookingSchema.virtual("isConfirmed").get(function () {
  return this.bookingStatus === "confirmed";
});

/*
|--------------------------------------------------------------------------
| Pre Save
|--------------------------------------------------------------------------
*/

bookingSchema.pre("save", function (next) {
  this.totalPilgrims = this.pilgrims?.length || 0;

  this.remainingAmount =
    (this.pricing?.totalPrice || 0) - (this.paidAmount || 0);

  next();
});

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

bookingSchema.index({
  bookingNumber: 1,
});

bookingSchema.index({
  user: 1,
});

bookingSchema.index({
  bookingStatus: 1,
});

bookingSchema.index({
  paymentStatus: 1,
});

bookingSchema.index({
  createdAt: -1,
});

export default mongoose.model("Booking", bookingSchema);
