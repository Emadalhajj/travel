// models/paymentTransaction-model.js

/*
=====================================================
Payment Transaction Model
=====================================================

هذا الموديل يسجل كل عملية دفع مرتبطة بالحجز.

لماذا نحتاجه؟
-----------------------------------------------------
لأن الحجز الواحد قد يحتوي:
- دفعة أولى
- دفعة ثانية
- دفعة نهائية
- عملية فاشلة
- عملية استرجاع

ولا يكفي تخزين paidAmount فقط داخل Booking.
=====================================================
*/

import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "TRY"],
      default: "SAR",
    },

    method: {
      type: String,
      enum: [
        "cash",
        "bank_transfer",
        "card",
        "mada",
        "stc_pay",
        "apple_pay",
        "visa",
        "mastercard",
      ],
      default: "cash",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    gateway: {
      type: String,
      trim: true,
    },

    gatewayReference: {
      type: String,
      trim: true,
      index: true,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    notes: {
      type: String,
      default: "",
      trim: true,
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

paymentTransactionSchema.index({
  booking: 1,
  createdAt: -1,
});

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);
