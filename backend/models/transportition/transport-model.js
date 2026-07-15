import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["bus", "van", "car", "plane", "ship", "train", "other"],
      required: true,
    },
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },

    descriptionAr: String,
    descriptionEn: String,
    capacity: Number,

    specs: {
      // type: Object,
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    features: {
      // like wifi , food , etc
      // type: Object,

      type: Map,
      of: Boolean,
      default: {},
    },

    images: [
      {
        type: String,
      },
    ],
    // منتج دائم الوفرة
    isAlwaysAvailable: {
  type: Boolean,
  default: true,
},
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timeseries: true },
);
export default mongoose.model("Transport", transportSchema);
