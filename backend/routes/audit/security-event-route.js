// routes/audit/security-event-route.js

/*
=====================================================
Security Event Routes
=====================================================

مسارات عرض الأحداث الأمنية.

الإدارة:
-----------------------------------------------------
- عرض كل الأحداث الأمنية
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import { AUDIT_READ_ROLES } from "../../constants/audit/audit-access.js";

import {
  listSecurityEvents,
} from "../../controllers/audit/security-event-controller.js";

const SecurityEventRoute = express.Router();

SecurityEventRoute.get(
  "/security-events",
  protect,
  authorize(AUDIT_READ_ROLES),
  listSecurityEvents,
);

export default SecurityEventRoute;
