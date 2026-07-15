// models/bookingLog-model.js

/*
=====================================================
Booking Log Model
=====================================================

هذا الموديل يسجل كل حدث يحدث على الحجز.

أمثلة:
-----------------------------------------------------
- إنشاء الحجز
- تحديث الحجز
- تغيير حالة الحجز
- تسجيل دفعة
- إلغاء الحجز
- تأكيد الحجز

الفائدة:
-----------------------------------------------------
يعطي الإدارة Timeline كامل لمعرفة من فعل ماذا ومتى.
=====================================================
*/

import mongoose from "mongoose";

const bookingLogSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    messageAr: {
      type: String,
      default: "",
    },

    messageEn: {
      type: String,
      default: "",
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    role: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

bookingLogSchema.index({
  booking: 1,
  createdAt: -1,
});

export default mongoose.model("BookingLog", bookingLogSchema);