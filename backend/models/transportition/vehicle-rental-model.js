import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const pricingPeriodSchema = new mongoose.Schema(
  {
    nameAr: String,
    nameEn: String,

    periodType: {
      type: String,
      enum: ["seasonal", "holiday", "weekend", "custom"],
      default: "custom",
    },

    startDate: Date,
    endDate: Date,

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    priority: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const vehicleRentalSchema = new mongoose.Schema(
  {
    transport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      required: true,
    },

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

    descriptionAr: String,
    descriptionEn: String,

    rentalType: {
      type: String,
      enum: ["hourly", "daily", "monthly", "yearly", "trip"],
      required: true,
      default: "daily",
    },

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

      pricingPeriods: [pricingPeriodSchema],
    },

    images: [String],

    isAlwaysAvailable: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const VehicleRental =
  mongoose.models.VehicleRental ||
  mongoose.model("VehicleRental", vehicleRentalSchema);

export default VehicleRental;
