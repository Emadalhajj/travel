// services/audit/audit-log-service.js

/*
=====================================================
Audit Log Service
=====================================================

هذا الملف يحتوي منطق تسجيل وقراءة سجلات التدقيق.

مسؤول عن:
-----------------------------------------------------
- إنشاء سجل تدقيق
- جلب سجلات التدقيق
- جلب سجلات كيان معين
=====================================================
*/

import AuditLog from "../../models/audit/audit-log-model.js";
import mongoose from "mongoose";

import { getRequestInfo } from "../../utils/requestInfo.js";

import {
  AUDIT_ENTITIES,
  AUDIT_ENTITIES_LIST,
} from "../../constants/audit/audit-entities.js";
import { AUDIT_ACTIONS_LIST } from "../../constants/audit/audit-actions.js";
import AppError from "../../utils/AppError.js";

import {
  sanitizePaymentProviderForAudit,
} from "../../utils/payments/sanitizePaymentProvider.js";

const MAX_PAGE_LIMIT = 100;
const USER_POPULATE_FIELDS = "firstName lastName username email role";
const REDACTED = "[REDACTED]";
const SENSITIVE_FIELD = /(password|passphrase|token|secret|credential|api[_-]?key|authorization|cookie|private[_-]?key)/i;
const CREDENTIAL_CONTAINER = /credentials?/i;

export const sanitizeSensitiveAuditData = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (value instanceof Date || value instanceof RegExp || value?._bsontype === "ObjectId") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  const source = typeof value.toObject === "function"
    ? value.toObject({ virtuals: false, getters: false })
    : value;
  if (Array.isArray(source)) return source.map((item) => sanitizeSensitiveAuditData(item, seen));
  return Object.entries(source).reduce((result, [key, item]) => {
    const isCredentialContainer = CREDENTIAL_CONTAINER.test(key) && item && typeof item === "object";
    result[key] = SENSITIVE_FIELD.test(key) && !isCredentialContainer
      ? REDACTED
      : sanitizeSensitiveAuditData(item, seen);
    return result;
  }, {});
};

export const sanitizeAuditValue = ({ entity, value }) => {
  const specializedValue = entity === AUDIT_ENTITIES.PAYMENT_PROVIDER
    ? sanitizePaymentProviderForAudit(value)
    : value;
  return sanitizeSensitiveAuditData(specializedValue);
};

const parseDate = (value, field, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(`Invalid ${field}`, 400, field);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const normalizeAuditPagination = ({ page = 1, limit = 20 } = {}) => ({
  page: Math.max(1, Math.floor(Number(page) || 1)),
  limit: Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(Number(limit) || 20))),
});

export const buildAuditLogFilter = ({ action, entity, entityId, user, dateFrom, dateTo } = {}) => {
  const filter = {};
  if (action) {
    if (!AUDIT_ACTIONS_LIST.includes(action)) throw new AppError("Invalid audit action", 400, "action");
    filter.action = action;
  }
  if (entity) {
    if (!AUDIT_ENTITIES_LIST.includes(entity)) throw new AppError("Invalid audit entity", 400, "entity");
    filter.entity = entity;
  }
  if (entityId) {
    if (!mongoose.Types.ObjectId.isValid(entityId)) throw new AppError("Invalid entityId", 400, "entityId");
    filter.entityId = entityId;
  }
  if (user) {
    if (!mongoose.Types.ObjectId.isValid(user)) throw new AppError("Invalid user", 400, "user");
    filter.user = user;
  }
  const from = parseDate(dateFrom, "dateFrom");
  const to = parseDate(dateTo, "dateTo", true);
  if (from && to && from > to) throw new AppError("dateFrom must be before dateTo", 400, "dateFrom");
  if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  return filter;
};

/*
=====================================================
createAuditLog
=====================================================

إنشاء سجل تدقيق جديد.

يستقبل:
-----------------------------------------------------
- req
- action
- entity
- entityId
- before
- after
- metadata
=====================================================
*/

export const createAuditLog = async ({
  req,
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  metadata = {},
}) => {
  const requestInfo = req ? getRequestInfo(req) : {};
  buildAuditLogFilter({ action, entity, entityId });

  /*
  حماية مركزية إضافية:
  لا تُحفظ بيانات اعتماد مزود الدفع الخام حتى لو نسي
  أحد المستدعين تنظيف before أو after مسبقًا.
  */
  const auditLog = await AuditLog.create({
    action,
    entity,
    entityId,
    user: req?.user?._id || null,
    before: sanitizeAuditValue({ entity, value: before }),
    after: sanitizeAuditValue({ entity, value: after }),
    metadata: sanitizeSensitiveAuditData(metadata),
    ...requestInfo,
  });

  return auditLog;
};

/*
=====================================================
getAuditLogs
=====================================================

جلب سجلات التدقيق للإدارة مع فلترة اختيارية.
=====================================================
*/

export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  entity,
  entityId,
  user,
  dateFrom,
  dateTo,
}) => {
  const pagination = normalizeAuditPagination({ page, limit });
  const skip = (pagination.page - 1) * pagination.limit;
  const filter = buildAuditLogFilter({ action, entity, entityId, user, dateFrom, dateTo });

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", USER_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit),

    AuditLog.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    pages: Math.ceil(total / pagination.limit),
  };
};

/*
=====================================================
getEntityAuditLogs
=====================================================

جلب سجل التدقيق الخاص بسجل معين.

مثال:
-----------------------------------------------------
كل عمليات التدقيق على حجز معين.
=====================================================
*/

export const getEntityAuditLogs = async ({ entity, entityId }) => {
  const filter = buildAuditLogFilter({ entity, entityId });
  const logs = await AuditLog.find(filter)
    .populate("user", USER_POPULATE_FIELDS)
    .sort({ createdAt: -1 });

  return logs;
};
