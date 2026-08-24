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
import { AUDIT_READ_ROLES } from "../../constants/audit/audit-access.js";

import {
  listAuditLogs,
  listEntityAuditLogs,
} from "../../controllers/audit/audit-log-controller.js";

const AuditLogRoute = express.Router();

AuditLogRoute.get(
  "/audit-logs",
  protect,
  authorize(AUDIT_READ_ROLES),
  listAuditLogs,
);

AuditLogRoute.get(
  "/audit-logs/:entity/:entityId",
  protect,
  authorize(AUDIT_READ_ROLES),
  listEntityAuditLogs,
);

export default AuditLogRoute;
