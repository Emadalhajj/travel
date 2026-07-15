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

import {
  listSecurityEvents,
} from "../../controllers/audit/security-event-controller.js";

const SecurityEventRoute = express.Router();

SecurityEventRoute.get(
  "/security-events",
  protect,
  authorize("admin", "superAdmin"),
  listSecurityEvents,
);

export default SecurityEventRoute;