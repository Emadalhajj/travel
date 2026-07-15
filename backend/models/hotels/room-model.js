import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true }
    },
    description: {
      ar: { type: String },
      en: { type: String }
    },
    images: [{ type: String }],

    price: { type: Number, required: true },

    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },

    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    address: { type: String },

    coordinates: {
      lat: Number,
      lng: Number,
    },

    amenities: [{ type: String }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
