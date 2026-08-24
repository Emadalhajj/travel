// models/audit/security-event-model.js

/*
=====================================================
Security Event Model
=====================================================

موديل الأحداث الأمنية.

يستخدم لتسجيل محاولات الوصول غير المصرح بها
أو الأحداث المشبوهة داخل النظام.
=====================================================
الفائدة من Security Events

Security Events مختلف عن Audit Log.

هو خاص بالأمان، مثل:

- مستخدم حاول يدخل بدون توكن
- مستخدم حاول يدخل صفحة admin وهو ليس admin
- توكن منتهي أو غير صالح
- حساب غير نشط حاول الوصول

يعني فائدته:

مراقبة محاولات الوصول غير المصرح بها والمشاكل الأمنية.
*/

import mongoose from "mongoose";

import {
  SECURITY_EVENT_TYPES_LIST,
} from "../../constants/audit/security-event-types.js";

const securityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: SECURITY_EVENT_TYPES_LIST,
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
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

const SecurityEvent =
  mongoose.models.SecurityEvent ||
  mongoose.model("SecurityEvent", securityEventSchema);

export default SecurityEvent;
