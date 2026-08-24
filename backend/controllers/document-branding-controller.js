import asyncHandler from "express-async-handler";
import { getDocumentBrandingService, updateDocumentBrandingService } from "../services/document-branding-service.js";

export const getDocumentBranding = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: await getDocumentBrandingService() });
});

export const updateDocumentBranding = asyncHandler(async (req, res) => {
  const data = await updateDocumentBrandingService({ data: req.body || {}, userId: req.user?._id });
  res.status(200).json({ success: true, message: "Document branding updated", data });
});
