import DocumentBranding from "../models/document-branding-model.js";

const DEFAULT_BRANDING = Object.freeze({
  companyNameAr: "",
  companyNameEn: "",
  addressAr: "",
  addressEn: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  logoDataUrl: "",
  qrValue: "",
  showLogo: true,
  showQr: true,
});

const validateLogo = (logoDataUrl) => {
  if (!logoDataUrl) return;
  if (!/^data:image\/(png|jpeg);base64,/i.test(logoDataUrl)) {
    const error = new Error("Logo must be a PNG or JPEG image");
    error.statusCode = 400;
    throw error;
  }
  if (Buffer.byteLength(logoDataUrl, "utf8") > 2.8 * 1024 * 1024) {
    const error = new Error("Logo must not exceed 2 MB");
    error.statusCode = 400;
    throw error;
  }
};

export const getDocumentBrandingService = async () => {
  const branding = await DocumentBranding.findOne({ key: "default" }).lean();
  return branding || DEFAULT_BRANDING;
};

export const updateDocumentBrandingService = async ({ data, userId }) => {
  validateLogo(data.logoDataUrl);
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    const error = new Error("Invalid company email address");
    error.statusCode = 400;
    throw error;
  }
  if (data.website) {
    try {
      new URL(data.website);
    } catch (_error) {
      const error = new Error("Invalid company website URL");
      error.statusCode = 400;
      throw error;
    }
  }
  const allowed = [
    "companyNameAr", "companyNameEn", "addressAr", "addressEn",
    "phone", "whatsapp", "email", "website", "logoDataUrl", "qrValue", "showLogo", "showQr",
  ];
  const update = Object.fromEntries(allowed.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
  update.updatedBy = userId || null;
  return DocumentBranding.findOneAndUpdate(
    { key: "default" },
    { $set: update, $setOnInsert: { key: "default" } },
    { new: true, upsert: true, runValidators: true },
  ).lean();
};
