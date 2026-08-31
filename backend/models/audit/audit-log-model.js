// models/audit/audit-log-model.js

/*
=====================================================
Audit Log Model
=====================================================

موديل سجل التدقيق.

يستخدم لتسجيل العمليات الحساسة داخل النظام.

يسجل:
-----------------------------------------------------
- من نفذ العملية
- نوع العملية
- الكيان المتأثر
- رقم السجل المتأثر
- القيم قبل التعديل
- القيم بعد التعديل
- معلومات الطلب
=====================================================
الفائدة من Audit Log

Audit Log فائدته الأساسية:

معرفة من فعل ماذا ومتى وعلى أي سجل.

مثال:

المشرف أحمد حذف الحجز BN-0023
في تاريخ 2026-05-24
من IP معين
وكانت بيانات الحجز قبل الحذف كذا
وبعد الحذف أصبحت isDeleted = true

هذا مهم جدًا في مشروع حجوزات لأن عندك:
*/

import mongoose from "mongoose";

import {
  AUDIT_ACTIONS_LIST,
} from "../../constants/audit/audit-actions.js";

import {
  AUDIT_ENTITIES_LIST,
} from "../../constants/audit/audit-entities.js";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: AUDIT_ACTIONS_LIST,
      required: true,
      index: true,
    },

    entity: {
      type: String,
      enum: AUDIT_ENTITIES_LIST,
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    before: {
      type: Object,
      default: null,
    },

    after: {
      type: Object,
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },

    ip: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    method: {
      type: String,
      default: null,
    },

    url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({
  entity: 1,
  entityId: 1,
  createdAt: -1,
});

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
