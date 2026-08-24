import mongoose from "mongoose";

const documentBrandingSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true, immutable: true },
  companyNameAr: { type: String, trim: true, maxlength: 120, default: "" },
  companyNameEn: { type: String, trim: true, maxlength: 120, default: "" },
  addressAr: { type: String, trim: true, maxlength: 300, default: "" },
  addressEn: { type: String, trim: true, maxlength: 300, default: "" },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  whatsapp: { type: String, trim: true, maxlength: 40, default: "" },
  email: { type: String, trim: true, maxlength: 160, default: "" },
  website: { type: String, trim: true, maxlength: 300, default: "" },
  logoDataUrl: { type: String, default: "" },
  qrValue: { type: String, trim: true, maxlength: 1000, default: "" },
  showLogo: { type: Boolean, default: true },
  showQr: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export default mongoose.model("DocumentBranding", documentBrandingSchema);
