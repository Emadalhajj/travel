// models/vouchers/voucher-model.js

/*
=====================================================
Voucher Model
=====================================================

موديل الفاوتشر.

يمثل ملف PDF الذي يتم إنشاؤه للحجز.

يحتوي على:
-----------------------------------------------------
- رقم الفاوتشر
- الحجز المرتبط به
- بيانات العميل
- رابط ملف PDF
- حالة الفاوتشر
- من قام بإنشائه
- بيانات الحذف الناعم Soft Delete

العلاقة:
-----------------------------------------------------
كل Voucher مرتبط بـ Booking واحد.
=====================================================
*/

import mongoose from "mongoose";

import {
  VOUCHER_STATUS,
  VOUCHER_STATUS_LIST,
} from "../constants/voucher-status.js";

const voucherSchema = new mongoose.Schema(
  {
    /*
    رقم الفاوتشر الفريد.
    مثال:
    VCH-2026-1710000000000-4589
    */
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    /*
    الحجز المرتبط بهذا الفاوتشر.
    */
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    /*
    نسخة مختصرة من بيانات العميل وقت إنشاء الفاوتشر.
    نحفظها هنا حتى لو تغيرت بيانات الحجز لاحقًا.
    */
    customer: {
      name: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        trim: true,
      },
    },

    /*
    رابط ملف PDF المحفوظ.
    */
    pdfUrl: {
      type: String,
      required: true,
      trim: true,
    },

    /*
    حالة الفاوتشر.
    */
    status: {
      type: String,
      enum: VOUCHER_STATUS_LIST,
      default: VOUCHER_STATUS.GENERATED,
      index: true,
    },

    /*
    المستخدم الذي قام بإنشاء الفاوتشر.
    */
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
    وقت إرسال الفاوتشر للعميل.
    */
    sentAt: {
      type: Date,
      default: null,
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

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;