// routes/audit/audit-log-route.js

/*
=====================================================
Audit Log Routes
=====================================================

مسارات عرض سجلات التدقيق.

الإدارة:
-----------------------------------------------------
- عرض كل سجلات التدقيق
- عرض سجلات كيان معين
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";

import {
  listAuditLogs,
  listEntityAuditLogs,
} from "../../controllers/audit/audit-log-controller.js";

const AuditLogRoute = express.Router();

AuditLogRoute.get(
  "/audit-logs",
  protect,
  authorize("admin", "superAdmin"),
  listAuditLogs,
);

AuditLogRoute.get(
  "/audit-logs/:entity/:entityId",
  protect,
  authorize("admin", "superAdmin"),
  listEntityAuditLogs,
);

export default AuditLogRoute;