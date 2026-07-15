import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    /* ======================
     *  BASIC INFO
     * ====================== */
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
    },
    descriptionEn: {
      type: String,
      default: "",
    },

    /* ======================
     *  TRIP TYPE
     * ====================== */
    tripType: {
      type: String,
      enum: ["tour", "transport", "package", "activity"],
      default: "tour",
    },

    /* ======================
     *  LOCATIONS
     * ====================== */
    fromCity: {
      type: String,
      required: function () {
        return this.tripType !== "package";
      },
    },
    toCity: {
      type: String,
      required: function () {
        return this.tripType !== "package";
      },
    },

    /* ======================
     *  DURATION & TIME
     * ====================== */
    duration: {
      days: { type: Number, default: 1 },
      nights: { type: Number, default: 0 },
    },

    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Number,
      // required: true,
      min: 0,
      max: 1439, // 23:59 = 1439 دقيقة
      validate: {
        validator: Number.isInteger,
        message: "يجب أن يكون عدد دقائق صحيح",
      },
    },

    /* ======================
     *  PRICING
     * ====================== */
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      discountPrice: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        enum: ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "TRY"],
        default: "SAR",
      },
    },

    /* ======================
     *  CAPACITY
     * ====================== */
    capacity: {
      maxAdults: {
        type: Number,
        // required: true,
      },
      maxChildren: {
        type: Number,
        default: 0,
      },
      totalSeats: {
        type: Number,
        // required: true,
        default: 0,
      },
      availableSeats: {
        type: Number,
        // required: true,
        default: 0,
      },
    },

    /* ======================
     *  IMAGES
     * ====================== */
    images: [
      {
        type: String,
      },
    ],

    /* ======================
     *  FEATURES (Checkboxes)
     * ====================== */
    features: {
      // like wifi , food , etc
      // type: Object,
      type: Map,
      of: Boolean,
      default: {},
    },

    /* ======================
     *  SPECS (Dynamic Selects)
     * ====================== */
    vehicleType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
    },
    /* ======================
     *  STATUS
     * ====================== */
    isActive: {
      type: Boolean,
      default: true,
    },

    /* ======================
     *  ADMIN
     * ====================== */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Trip", tripSchema);
