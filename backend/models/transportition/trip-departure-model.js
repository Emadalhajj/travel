import mongoose from "mongoose";

import {
  TRIP_SOURCE_VALUES,
  TRIP_SOURCES,
} from "../../constants/trips/trip.constants.js";
import {
  TRIP_DEPARTURE_STATUS,
  TRIP_DEPARTURE_STATUS_VALUES,
} from "../../constants/trips/trip-departure.constants.js";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "../../constants/currencies.js";

/*
يمثل جزءًا تشغيليًا واحدًا من الرحلة، ويصلح للرحلات
الجوية والبرية والبحرية دون إنشاء Model مستقل لكل نوع.
*/
const tripDepartureSegmentSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      min: 0,
      default: 0,
    },
    from: {
      type: String,
      trim: true,
      default: "",
    },
    to: {
      type: String,
      trim: true,
      default: "",
    },
    departureAt: {
      type: Date,
      default: null,
    },
    arrivalAt: {
      type: Date,
      default: null,
    },
    transportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      default: null,
    },
    carrierCode: {
      type: String,
      trim: true,
      default: "",
    },
    carrierName: {
      type: String,
      trim: true,
      default: "",
    },
    serviceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    departureTerminal: {
      type: String,
      trim: true,
      default: "",
    },
    arrivalTerminal: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true },
);

/*
Trip هو تعريف المنتج، بينما TripDeparture هو التشغيل الفعلي
للمنتج في تاريخ ووقت محددين.
*/
const tripDepartureSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    departureAt: {
      type: Date,
      required: true,
      index: true,
    },
    arrivalAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: TRIP_DEPARTURE_STATUS_VALUES,
      default: TRIP_DEPARTURE_STATUS.DRAFT,
      index: true,
    },
    source: {
      type: String,
      enum: TRIP_SOURCE_VALUES,
      default: TRIP_SOURCES.MANUAL,
      index: true,
    },
    providerId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    externalId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    serviceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    pricing: {
      basePrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      discountPrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: DEFAULT_CURRENCY,
      },
    },
    capacity: {
      totalSeats: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    segments: {
      type: [tripDepartureSegmentSchema],
      default: [],
    },
    notesAr: {
      type: String,
      trim: true,
      default: "",
    },
    notesEn: {
      type: String,
      trim: true,
      default: "",
    },
    migration: {
      key: { type: String, trim: true, default: "" },
      legacyTripId: { type: mongoose.Schema.Types.ObjectId, default: null },
      migratedAt: { type: Date, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
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
  { timestamps: true },
);

tripDepartureSchema.index({
  tripId: 1,
  departureAt: 1,
  isDeleted: 1,
});

tripDepartureSchema.index(
  { "migration.key": 1 },
  {
    unique: true,
    partialFilterExpression: { "migration.key": { $type: "string", $gt: "" } },
    name: "unique_trip_departure_migration_key",
  },
);

tripDepartureSchema.virtual("inventory", {
  ref: "Inventory",
  localField: "_id",
  foreignField: "itemId",
  justOne: true,
  match: { inventoryType: "tripDeparture", isDeleted: { $ne: true } },
});

tripDepartureSchema.set("toJSON", { virtuals: true });
tripDepartureSchema.set("toObject", { virtuals: true });

tripDepartureSchema.index({
  status: 1,
  isActive: 1,
  isDeleted: 1,
  departureAt: 1,
});

tripDepartureSchema.index({
  providerId: 1,
  externalId: 1,
});

const TripDeparture =
  mongoose.models.TripDeparture ||
  mongoose.model("TripDeparture", tripDepartureSchema);

export default TripDeparture;
