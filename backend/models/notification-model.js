// models/notification-model.js

/*
=====================================================
Notification Model
=====================================================

هذا الموديل مسؤول عن حفظ كل إشعار في قاعدة البيانات.

لماذا نحفظ الإشعارات؟
-----------------------------------------------------
1- حتى تظهر للمستخدم داخل لوحة "إشعاراتي".
2- حتى يعرف الأدمن هل تم إرسال الإشعار أم فشل.
3- حتى يمكن إعادة المحاولة لاحقاً.
4- حتى يكون لديك سجل كامل لكل إشعار.

أنواع القنوات:
-----------------------------------------------------
database  => إشعار داخل النظام
email     => بريد إلكتروني
sms       => رسالة SMS
whatsapp  => واتساب
=====================================================
*/

import mongoose from "mongoose";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_VALUES,
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_VALUES,
} from "../constants/notifications/notification-constants.js";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },

    titleAr: {
      type: String,
      default: "",
      trim: true,
    },

    titleEn: {
      type: String,
      default: "",
      trim: true,
    },

    messageAr: {
      type: String,
      required: true,
    },

    messageEn: {
      type: String,
      required: true,
    },

    channel: {
      type: String,
      enum: NOTIFICATION_CHANNEL_VALUES,
      default: NOTIFICATION_CHANNELS.DATABASE,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      default: NOTIFICATION_TYPES.GENERAL,
    },

    status: {
      type: String,
      enum: NOTIFICATION_STATUS_VALUES,
      default: NOTIFICATION_STATUS.PENDING,
    },

    deduplicationKey: {
      type: String,
      default: null,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    sentAt: Date,

    failedReason: {
      type: String,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    /*
        Soft Delete
        لا نحذف الفاوتشر نهائيًا من قاعدة البيانات.
        */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  user: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index(
  { deduplicationKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deduplicationKey: { $type: "string" },
    },
    name: "unique_notification_deduplication_key",
  },
);

notificationSchema.index({
  booking: 1,
  createdAt: -1,
});

export default mongoose.model("Notification", notificationSchema);
