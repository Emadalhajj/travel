import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import {
  TRIP_TYPES,
  TRIP_TYPE_VALUES,
  TRIP_SCOPES,
  TRIP_SCOPE_VALUES,
  TRIP_SOURCES,
  TRIP_SOURCE_VALUES,
  ALL_TRIP_SUBTYPE_VALUES,
} from "../../constants/trips/trip.constants.js";

const routePointSchema = new mongoose.Schema(
  {
    location: { type: String, trim: true, required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

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
     *  TRIP
     * ====================== */
    type: {
      type: String,
      enum: TRIP_TYPE_VALUES,
      // required: true,
    },
    scope: {
      type: String,
      enum: TRIP_SCOPE_VALUES,
      // required: true,
      default: TRIP_SCOPES.DOMESTIC,
    },
    subtype:{
      type: String,
      enum: ALL_TRIP_SUBTYPE_VALUES,

    },
    source: {
  type: String,
  enum: TRIP_SOURCE_VALUES,
  default: TRIP_SOURCES.MANUAL,
},

    tripType: {
  type: String,
  enum: [
    "tour",
    "transport",
    "package",
    "activity",
  ],
},

    airline: { type: String, trim: true, default: "" },
    flightNumber: { type: String, trim: true, default: "" },
    originAirport: { type: String, trim: true, default: "" },
    destinationAirport: { type: String, trim: true, default: "" },
    departureTerminal: { type: String, trim: true, default: "" },
    arrivalTerminal: { type: String, trim: true, default: "" },
    cabinClass: { type: String, trim: true, default: "" },
    fareClass: { type: String, trim: true, default: "" },
    baggage: { type: String, trim: true, default: "" },
    aircraft: { type: String, trim: true, default: "" },
    transportId: { type: mongoose.Schema.Types.ObjectId, ref: "Transport", default: null },
    routeStops: { type: [routePointSchema], default: [] },
    vesselName: { type: String, trim: true, default: "" },
    ports: { type: [routePointSchema], default: [] },
    cabinTypes: { type: String, trim: true, default: "" },
    mealsIncluded: { type: Boolean, default: false },
    baggagePolicy: { type: String, trim: true, default: "" },

    /* ======================
     *  LOCATIONS
     * ====================== */
    fromCity: {
      type: String,
      default: "",
    },
    toCity: {
      type: String,
      default: "",
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
      default: null,
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
        enum: SUPPORTED_CURRENCIES,
        default: DEFAULT_CURRENCY,
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

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ======================
     *  SOFT DELETE
     * ====================== */
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

tripSchema.virtual("departuresCount", {
  ref: "TripDeparture",
  localField: "_id",
  foreignField: "tripId",
  count: true,
  match: { isDeleted: false },
});

tripSchema.set("toJSON", { virtuals: true });
tripSchema.set("toObject", { virtuals: true });

export default mongoose.model("Trip", tripSchema);
