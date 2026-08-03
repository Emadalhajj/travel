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

import { getRequestInfo } from "../../utils/requestInfo.js";

import {
  AUDIT_ENTITIES,
} from "../../constants/audit/audit-entities.js";

import {
  sanitizePaymentProviderForAudit,
} from "../../utils/payments/sanitizePaymentProvider.js";

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

  /*
  حماية مركزية إضافية:
  لا تُحفظ بيانات اعتماد مزود الدفع الخام حتى لو نسي
  أحد المستدعين تنظيف before أو after مسبقًا.
  */
  const shouldSanitizePaymentProvider =
    entity ===
    AUDIT_ENTITIES.PAYMENT_PROVIDER;

  const sanitizedBefore =
    shouldSanitizePaymentProvider
      ? sanitizePaymentProviderForAudit(
          before,
        )
      : before;

  const sanitizedAfter =
    shouldSanitizePaymentProvider
      ? sanitizePaymentProviderForAudit(
          after,
        )
      : after;

  const auditLog = await AuditLog.create({
    action,
    entity,
    entityId,
    user: req?.user?._id || null,
    before: sanitizedBefore,
    after: sanitizedAfter,
    metadata,
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
  user,
}) => {
  const skip = (page - 1) * limit;

  const filter = {};

  if (action) {
    filter.action = action;
  }

  if (entity) {
    filter.entity = entity;
  }

  if (user) {
    filter.user = user;
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    AuditLog.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
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
  const logs = await AuditLog.find({
    entity,
    entityId,
  })
    .populate("user", "name email role")
    .sort({ createdAt: -1 });

  return logs;
};
