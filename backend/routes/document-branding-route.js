import express from "express";
import { getDocumentBranding, updateDocumentBranding } from "../controllers/document-branding-controller.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { USER_ROLES } from "../constants/auth/roles.js";

const router = express.Router();
router.get("/document-branding", getDocumentBranding);
router.patch(
  "/document-branding",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  updateDocumentBranding,
);

export default router;
