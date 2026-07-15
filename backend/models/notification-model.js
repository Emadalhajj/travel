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
      enum: ["database", "email", "sms", "whatsapp"],
      default: "database",
    },

    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "booking_cancelled",
        "payment_received",
        "payment_failed",
        "documents_ready",
        "general",
      ],
      default: "general",
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
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

notificationSchema.index({
  booking: 1,
  createdAt: -1,
});

export default mongoose.model("Notification", notificationSchema);
