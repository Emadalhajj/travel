// models/visaType-model.js
import mongoose from "mongoose";

const visaTypeSchema = new mongoose.Schema(
  {
    nameEn: {
      type: String,
      required: [true, "Visa type name (English) is required"],
      trim: true,
    }, 
    nameAr: {
      type: String,
      required: [true, "Visa type name (Arabic) is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("VisaType", visaTypeSchema);
